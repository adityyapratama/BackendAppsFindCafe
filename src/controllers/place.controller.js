const prisma = require('../config/prisma');
const { successResponse, errorResponse } = require('../utils/response');

const getPlaces = async (req, res, next) => {
  try {
    const {
      search,
      category_id,
      tag_ids,
      district,
      min_rating,
      price_min,
      price_max,
      lat,
      lng,
      radius_km,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    const where = { status: 'approved', isPermanentlyClosed: false };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category_id) where.categoryId = BigInt(category_id);
    if (district) where.district = district;
    if (min_rating) where.avgRating = { gte: parseFloat(min_rating) };
    if (price_min) where.priceMin = { gte: parseInt(price_min) };
    if (price_max) where.priceMax = { lte: parseInt(price_max) };

    if (tag_ids) {
      const tagIds = tag_ids.split(',').map((id) => BigInt(id));
      where.placeTags = { some: { tagId: { in: tagIds } } };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    let orderBy = { createdAt: 'desc' };
    if (sort === 'rating') orderBy = { avgRating: 'desc' };
    if (sort === 'newest') orderBy = { createdAt: 'desc' };
    if (sort === 'recommended') orderBy = { recommendationCount: 'desc' };

    const [places, total] = await Promise.all([
      prisma.place.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: { select: { name: true, slug: true, icon: true } },
          placeTags: { include: { tag: { select: { name: true, slug: true, type: true } } } },
        },
      }),
      prisma.place.count({ where }),
    ]);

    const placesWithDistance = places.map((place) => {
      let distance = null;
      if (lat && lng) {
        const R = 6371;
        const dLat = (parseFloat(lat) - parseFloat(place.latitude)) * (Math.PI / 180);
        const dLon = (parseFloat(lng) - parseFloat(place.longitude)) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(parseFloat(lat) * (Math.PI / 180)) *
            Math.cos(parseFloat(place.latitude) * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance = R * c;
      }
      return { ...place, distance };
    });

    let filteredPlaces = placesWithDistance;
    if (radius_km && lat && lng) {
      filteredPlaces = placesWithDistance.filter((p) => p.distance <= parseFloat(radius_km));
    }

    if (sort === 'distance' && lat && lng) {
      filteredPlaces.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    return successResponse(res, filteredPlaces, 'Places retrieved', {
      total: filteredPlaces.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    next(error);
  }
};

const getPlaceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const place = await prisma.place.findFirst({
      where: { id: BigInt(id), status: 'approved' },
      include: {
        category: { select: { name: true, slug: true, icon: true } },
        placeTags: { include: { tag: { select: { name: true, slug: true, type: true } } } },
        openingHours: true,
        photos: { where: { status: 'approved' }, take: 10 },
      },
    });

    if (!place) {
      return errorResponse(res, 'Place not found', null, 404);
    }

    return successResponse(res, place, 'Place retrieved');
  } catch (error) {
    next(error);
  }
};

const createPlace = async (req, res, next) => {
  try {
    const { name, description, address, district, latitude, longitude, categoryId, priceMin, priceMax, phone, websiteUrl, instagramUrl, googleMapsUrl } = req.body;

    const settings = await prisma.appSettings.findFirst();
    const approvalMode = settings?.placeApprovalMode || 'manual';
    const status = approvalMode === 'auto' ? 'approved' : 'pending';
    const approvedVia = approvalMode === 'auto' ? 'auto' : null;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const place = await prisma.place.create({
      data: {
        name,
        slug,
        description,
        address,
        district,
        latitude,
        longitude,
        categoryId: BigInt(categoryId),
        priceMin,
        priceMax,
        phone,
        websiteUrl,
        instagramUrl,
        googleMapsUrl,
        submittedBy: BigInt(req.user.id),
        status,
        approvedVia,
      },
    });

    return successResponse(res, place, 'Place submitted successfully', 201);
  } catch (error) {
    next(error);
  }
};

const uploadPhoto = async (req, res, next) => {
  try {
    const { placeId } = req.params;
    const { photoUrl, caption, isCover } = req.body;

    const settings = await prisma.appSettings.findFirst();
    const approvalMode = settings?.photoApprovalMode || 'manual';
    const status = approvalMode === 'auto' ? 'approved' : 'pending';
    const approvedVia = approvalMode === 'auto' ? 'auto' : null;

    const photo = await prisma.placePhoto.create({
      data: {
        placeId: BigInt(placeId),
        uploadedBy: BigInt(req.user.id),
        photoUrl,
        caption,
        isCover,
        status,
        approvedVia,
      },
    });

    return successResponse(res, photo, 'Photo uploaded successfully', 201);
  } catch (error) {
    next(error);
  }
};

const createEditRequest = async (req, res, next) => {
  try {
    const { placeId } = req.params;
    const { proposedData } = req.body;

    const editRequest = await prisma.placeEditRequest.create({
      data: {
        placeId: BigInt(placeId),
        submittedBy: BigInt(req.user.id),
        proposedData,
      },
    });

    return successResponse(res, editRequest, 'Edit request submitted', 201);
  } catch (error) {
    next(error);
  }
};

const createReport = async (req, res, next) => {
  try {
    const { placeId } = req.params;
    const { reasonType, description } = req.body;

    const report = await prisma.report.create({
      data: {
        placeId: BigInt(placeId),
        reportedBy: BigInt(req.user.id),
        reasonType,
        description,
      },
    });

    await prisma.place.update({
      where: { id: BigInt(placeId) },
      data: { reportCount: { increment: 1 } },
    });

    return successResponse(res, report, 'Report submitted', 201);
  } catch (error) {
    next(error);
  }
};

module.exports = { getPlaces, getPlaceById, createPlace, uploadPhoto, createEditRequest, createReport };
