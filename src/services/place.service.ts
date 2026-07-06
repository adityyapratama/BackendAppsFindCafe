import prisma from '../config/prisma';
import { parseGoogleMapsUrl, distanceMeters } from '../utils/geo';

// P4: two submissions closer than this (metres) are flagged as possible dupes.
const DUPLICATE_RADIUS_M = 200;

const generateUniqueSlug = async (name) => {
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await prisma.place.findUnique({ where: { slug } });
    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
};

const getPlaces = async (query) => {
  const { search, category_id, tag_ids, district, min_rating, price_min, price_max, lat, lng, radius_km, sort, page = 1, limit = 10 } = query;

  const skip = (parseInt(page as any) - 1) * parseInt(limit as any);
  const take = parseInt(limit as any);

  // If distance filter requested, use raw query with Haversine
  if (lat && lng && radius_km) {
    return getPlacesWithDistance(query, skip, take);
  }

  const where: any = { status: 'approved', isPermanentlyClosed: false };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (category_id) where.categoryId = BigInt(category_id as any | number);
  if (district) where.district = district;
  if (min_rating) where.avgRating = { gte: parseFloat(min_rating as any) };
  if (price_min) where.priceMin = { gte: parseInt(price_min as any) };
  if (price_max) where.priceMax = { lte: parseInt(price_max as any) };
  if (tag_ids) {
    where.placeTags = { some: { tagId: { in: tag_ids.split(',').map((id) => BigInt(id as any | number)) } } };
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'rating') orderBy = { avgRating: 'desc' };
  if (sort === 'recommended') orderBy = { recommendationCount: 'desc' };

  const [places, total] = await Promise.all([
    prisma.place.findMany({
      where, skip, take, orderBy,
      include: {
        category: { select: { name: true, slug: true, icon: true } },
        placeTags: { include: { tag: { select: { name: true, slug: true, type: true } } } },
      },
    }),
    prisma.place.count({ where }),
  ]);

  return { places, total, page: parseInt(page as any), limit: take, totalPages: Math.ceil(total / take) };
};

const getPlacesWithDistance = async (query, skip, take) => {
  const { lat, lng, radius_km, search, category_id, district, min_rating, sort } = query;
  const latitude = parseFloat(lat as any);
  const longitude = parseFloat(lng as any);
  const radius = parseFloat(radius_km as any);

  let whereClause = `WHERE p.status = 'approved' AND p.is_permanently_closed = false`;
  const params = [latitude, longitude, radius];
  let paramIndex = 4;

  if (search) {
    whereClause += ` AND (p.name ILIKE $${paramIndex} OR p.address ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
    params.push(`%${search}%` as any);
    paramIndex++;
  }
  if (category_id) {
    whereClause += ` AND p.category_id = $${paramIndex}`;
    params.push(Number(category_id as any | number));
    paramIndex++;
  }
  if (district) {
    whereClause += ` AND p.district = $${paramIndex}`;
    params.push(district as any);
    paramIndex++;
  }
  if (min_rating) {
    whereClause += ` AND p.avg_rating >= $${paramIndex}`;
    params.push(parseFloat(min_rating as any));
    paramIndex++;
  }

  let orderClause = 'ORDER BY distance ASC';
  if (sort === 'rating') orderClause = 'ORDER BY p.avg_rating DESC';
  if (sort === 'recommended') orderClause = 'ORDER BY p.recommendation_count DESC';

  const distanceExpr = `(6371 * acos(cos(radians($1)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians($2)) + sin(radians($1)) * sin(radians(p.latitude))))`;

  const countQuery = `
    SELECT COUNT(*) as total FROM places p
    ${whereClause}
    AND ${distanceExpr} <= $3
  `;

  const dataQuery = `
    SELECT p.*,
      ${distanceExpr} AS distance
    FROM places p
    ${whereClause}
    AND ${distanceExpr} <= $3
    ${orderClause}
    LIMIT ${take} OFFSET ${skip}
  `;

  const [countResult, places] = await Promise.all([
    prisma.$queryRawUnsafe(countQuery, ...params),
    prisma.$queryRawUnsafe(dataQuery, ...params),
  ]);

  const total = Number(countResult[0]?.total || 0);

  return { places, total, page: Math.floor(skip / take) + 1, limit: take, totalPages: Math.ceil(total / take) };
};

import * as cacheService from "./cache.service";

const getPlaceById = async (id) => {
  const cacheKey = cacheService.KEYS.PLACE_DETAIL(id);
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  const [place, reviewStats] = await Promise.all([
    prisma.place.findFirst({
      where: { id: BigInt(id as any | number), status: 'approved' },
      include: {
        category: { select: { name: true, slug: true, icon: true } },
        placeTags: { include: { tag: { select: { name: true, slug: true, type: true } } } },
        openingHours: true,
        photos: { where: { status: 'approved' }, take: 10 },
      },
    }),
    prisma.review.groupBy({
      by: ['rating'],
      where: { placeId: BigInt(id as any | number), status: 'approved' },
      _count: { rating: true },
    }),
  ]);

  if (!place) {
    const error = new Error('Place not found');
    error.statusCode = 404;
    throw error;
  }

  const ratingDistribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  for (const r of reviewStats) {
    ratingDistribution[String(r.rating)] = r._count.rating;
  }

  const result = { ...place, reviewCount: place.ratingCount, ratingDistribution };
  cacheService.set(cacheKey, result, cacheService.TTL.PLACE_DETAIL);
  return result;
};

// P5: resolve coordinates, falling back to the Google Maps URL when the
// client did not provide an explicit lat/lng (e.g. user pasted a share link).
const resolveCoordinates = (data) => {
  const hasLat = data.latitude !== undefined && data.latitude !== null;
  const hasLng = data.longitude !== undefined && data.longitude !== null;
  if (hasLat && hasLng) {
    return { latitude: Number(data.latitude), longitude: Number(data.longitude) };
  }

  const fromUrl = parseGoogleMapsUrl(data.googleMapsUrl);
  if (fromUrl) return fromUrl;

  const error: any = new Error('Validation failed');
  error.statusCode = 400;
  error.errors = {
    latitude: [
      'latitude & longitude wajib diisi, atau sertakan googleMapsUrl yang memuat koordinat',
    ],
  };
  throw error;
};

// P4: find already-submitted places within DUPLICATE_RADIUS_M of the given
// coordinates. Non-blocking — returned as a warning, never rejects the create.
const findPossibleDuplicates = async (latitude: number, longitude: number) => {
  // ~0.002 deg ≈ 220m at Surabaya's latitude; a cheap bounding box prefilter
  // before the exact Haversine check.
  const delta = 0.002;
  const candidates = await prisma.place.findMany({
    where: {
      status: { in: ['pending', 'approved'] },
      latitude: { gte: latitude - delta, lte: latitude + delta },
      longitude: { gte: longitude - delta, lte: longitude + delta },
    },
    select: { id: true, name: true, latitude: true, longitude: true, status: true },
    take: 20,
  });

  return candidates
    .map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      distanceMeters: Math.round(
        distanceMeters(
          { latitude, longitude },
          { latitude: Number(c.latitude), longitude: Number(c.longitude) }
        )
      ),
    }))
    .filter((c) => c.distanceMeters <= DUPLICATE_RADIUS_M)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, 5);
};

const createPlace = async (data, userId) => {
  const { latitude, longitude } = resolveCoordinates(data);

  const settings = await prisma.appSettings.findFirst();
  const approvalMode = settings?.placeApprovalMode || 'manual';
  const status = approvalMode === 'auto' ? 'approved' : 'pending';
  const approvedVia = approvalMode === 'auto' ? 'auto' : null;
  const slug = await generateUniqueSlug(data.name);

  const possibleDuplicates = await findPossibleDuplicates(latitude, longitude);

  const place = await prisma.place.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      address: data.address,
      district: data.district,
      latitude,
      longitude,
      categoryId: BigInt(data.categoryId),
      priceMin: data.priceMin,
      priceMax: data.priceMax,
      phone: data.phone,
      websiteUrl: data.websiteUrl,
      instagramUrl: data.instagramUrl,
      googleMapsUrl: data.googleMapsUrl,
      submittedBy: BigInt(userId as any | number),
      status,
      approvedVia,
    },
  });

  // Spread the place fields at the top level so existing clients keep reading
  // data.id/data.status unchanged; the warning rides alongside.
  return { ...place, possibleDuplicates };
};

// P3: list the authenticated user's own submissions across every status.
const getMyPlaces = async (userId, query) => {
  const page = parseInt((query?.page as any) || '1');
  const limit = parseInt((query?.limit as any) || '10');
  const skip = (page - 1) * limit;

  const where: any = { submittedBy: BigInt(userId as any | number) };
  if (query?.status) where.status = query.status;

  const [places, total] = await Promise.all([
    prisma.place.findMany({
      where,
      skip,
      take: limit,
      orderBy: { submittedAt: 'desc' },
      include: { category: { select: { name: true, slug: true, icon: true } } },
    }),
    prisma.place.count({ where }),
  ]);

  return { places, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// P1: persist a place's cover photo URL after a cover image is uploaded.
const setCoverPhotoUrl = (placeId, photoUrl: string) =>
  prisma.place.update({
    where: { id: BigInt(placeId as any | number) },
    data: { coverPhotoUrl: photoUrl },
  });

import { uploadToCloudinary } from '../config/cloudinary';

const uploadPhoto = async (placeId, userId, { file, caption, isCover }) => {
  const settings = await prisma.appSettings.findFirst();
  const approvalMode = settings?.photoApprovalMode || 'manual';
  const status = approvalMode === 'auto' ? 'approved' : 'pending';
  const approvedVia = approvalMode === 'auto' ? 'auto' : null;

  let photoUrl, storagePath;

  if (file) {
    const result = await uploadToCloudinary(file.buffer, {
      folder: `cafe-surabaya/places/${placeId}`,
      transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }],
    });
    photoUrl = (result as any).secure_url;
    storagePath = (result as any).public_id;
  } else {
    const error = new Error('Photo file is required');
    error.statusCode = 400;
    throw error;
  }

  return prisma.placePhoto.create({
    data: { placeId: BigInt(placeId as any | number), uploadedBy: BigInt(userId as any | number), photoUrl, storagePath, caption, isCover: isCover === 'true', status, approvedVia },
  });
};

const createEditRequest = async (placeId, userId, proposedData) => {
  if (!proposedData || typeof proposedData !== 'object' || Object.keys(proposedData).length === 0) {
    const error = new Error('proposedData must be a non-empty object');
    error.statusCode = 400;
    throw error;
  }
  return prisma.placeEditRequest.create({
    data: { placeId: BigInt(placeId as any | number), submittedBy: BigInt(userId as any | number), proposedData },
  });
};

const createReport = async (placeId, userId, { reasonType, description }) => {
  const report = await prisma.report.create({
    data: { placeId: BigInt(placeId as any | number), reportedBy: BigInt(userId as any | number), reasonType, description },
  });
  await prisma.place.update({ where: { id: BigInt(placeId as any | number) }, data: { reportCount: { increment: 1 } } });
  return report;
};

export { getPlaces, getPlaceById, createPlace, getMyPlaces, setCoverPhotoUrl, uploadPhoto, createEditRequest, createReport };
