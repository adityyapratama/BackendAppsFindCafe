import prisma from '../config/prisma';
import { recalculateRating } from './review.service';
import * as cacheService from "./cache.service";

const ALLOWED_EDIT_FIELDS = [
  'name', 'description', 'address', 'district', 'subdistrict',
  'postalCode', 'latitude', 'longitude', 'priceMin', 'priceMax',
  'phone', 'websiteUrl', 'instagramUrl', 'googleMapsUrl',
];

const logModeration = (adminId, targetType, targetId, action, note = null, beforeData = null, afterData = null) => {
  return prisma.moderationLog.create({
    data: { adminId: BigInt(adminId as any | number), targetType, targetId: BigInt(targetId as any | number), action, note, beforeData, afterData },
  });
};

// Settings
const getSettings = async () => {
  const settings = await prisma.appSettings.findFirst();
  if (!settings) return prisma.appSettings.create({ data: {} });
  return settings;
};

const updateSettings = async (data, adminId) => {
  const existing = await prisma.appSettings.findFirst();
  const updateData = { ...data, updatedBy: BigInt(adminId as any | number) };

  const settings = existing
    ? await prisma.appSettings.update({ where: { id: existing.id }, data: updateData })
    : await prisma.appSettings.create({ data: updateData });

  await logModeration(adminId, 'setting', settings.id, 'update_setting', null, null, updateData);
  cacheService.del(cacheService.KEYS.SETTINGS);
  return settings;
};

// Places
const getPlaces = async ({ status, search, page = 1, limit = 10 }) => {
  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (parseInt(page as any) - 1) * parseInt(limit as any);
  const take = parseInt(limit as any);

  const [places, total] = await Promise.all([
    prisma.place.findMany({
      where, skip, take, orderBy: { createdAt: 'desc' },
      include: { category: { select: { name: true } }, submitter: { select: { id: true, name: true, email: true } } },
    }),
    prisma.place.count({ where }),
  ]);

  return { places, total, page: parseInt(page as any), limit: take, totalPages: Math.ceil(total / take) };
};

const getPlaceById = async (id) => {
  const place = await prisma.place.findUnique({
    where: { id: BigInt(id as any | number) },
    include: { category: true, placeTags: { include: { tag: true } }, openingHours: true, photos: true, reviews: true, editRequests: true, reports: true },
  });
  if (!place) { const e = new Error('Place not found'); e.statusCode = 404; throw e; }
  return place;
};

const approvePlace = async (id, adminId) => {
  const place = await prisma.place.update({
    where: { id: BigInt(id as any | number) },
    data: { status: 'approved', approvedBy: BigInt(adminId as any | number), approvedVia: 'manual', reviewedAt: new Date() },
  });
  await logModeration(adminId, 'place', id, 'approve');
  cacheService.del(cacheService.KEYS.PLACE_DETAIL(id));
  return place;
};

const rejectPlace = async (id, adminId, rejectionReason) => {
  const place = await prisma.place.update({
    where: { id: BigInt(id as any | number) },
    data: { status: 'rejected', approvedBy: BigInt(adminId as any | number), rejectionReason, reviewedAt: new Date() },
  });
  await logModeration(adminId, 'place', id, 'reject', rejectionReason);
  cacheService.del(cacheService.KEYS.PLACE_DETAIL(id));
  return place;
};

const archivePlace = async (id, adminId) => {
  const place = await prisma.place.update({ where: { id: BigInt(id as any | number) }, data: { status: 'archived' } });
  await logModeration(adminId, 'place', id, 'archive');
  cacheService.del(cacheService.KEYS.PLACE_DETAIL(id));
  return place;
};

const restorePlace = async (id, adminId) => {
  const place = await prisma.place.update({ where: { id: BigInt(id as any | number) }, data: { status: 'pending' } });
  await logModeration(adminId, 'place', id, 'restore');
  cacheService.del(cacheService.KEYS.PLACE_DETAIL(id));
  return place;
};

// Reports
const getReports = async ({ status, page = 1, limit = 10 }) => {
  const where: any = {};
  if (status) where.status = status;
  const skip = (parseInt(page as any) - 1) * parseInt(limit as any);
  const take = parseInt(limit as any);

  const [reports, total] = await Promise.all([
    prisma.report.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { place: { select: { id: true, name: true } }, reporter: { select: { id: true, name: true } } } }),
    prisma.report.count({ where }),
  ]);
  return { reports, total, page: parseInt(page as any), limit: take };
};

const resolveReport = async (id, adminId, { resolutionNote, status = 'resolved' }) => {
  const report = await prisma.report.update({
    where: { id: BigInt(id as any | number) },
    data: { status, resolutionNote, resolvedBy: BigInt(adminId as any | number), resolvedAt: new Date() },
  });
  await logModeration(adminId, 'report', id, 'resolve_report', resolutionNote);
  return report;
};

// Edit Requests
const getEditRequests = async ({ status, page = 1, limit = 10 }) => {
  const where: any = {};
  if (status) where.status = status;
  const skip = (parseInt(page as any) - 1) * parseInt(limit as any);
  const take = parseInt(limit as any);

  const [editRequests, total] = await Promise.all([
    prisma.placeEditRequest.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { place: { select: { id: true, name: true } }, submitter: { select: { id: true, name: true } } } }),
    prisma.placeEditRequest.count({ where }),
  ]);
  return { editRequests, total, page: parseInt(page as any), limit: take };
};

const approveEditRequest = async (id, adminId, reviewNote) => {
  const editRequest = await prisma.placeEditRequest.findUnique({ where: { id: BigInt(id as any | number) } });
  if (!editRequest) { const e = new Error('Edit request not found'); e.statusCode = 404; throw e; }

  const sanitized = Object.fromEntries(
    Object.entries(editRequest.proposedData).filter(([key]) => ALLOWED_EDIT_FIELDS.includes(key))
  );
  if (Object.keys(sanitized).length === 0) { const e = new Error('No valid fields'); e.statusCode = 400; throw e; }

  await prisma.place.update({ where: { id: editRequest.placeId }, data: sanitized });
  await prisma.placeEditRequest.update({ where: { id: BigInt(id as any | number) }, data: { status: 'approved', reviewedBy: BigInt(adminId as any | number), reviewNote, reviewedAt: new Date() } });
  await logModeration(adminId, 'edit_request', id, 'approve', reviewNote, null, sanitized);
  cacheService.del(cacheService.KEYS.PLACE_DETAIL(editRequest.placeId.toString()));
};

const rejectEditRequest = async (id, adminId, reviewNote) => {
  await prisma.placeEditRequest.update({ where: { id: BigInt(id as any | number) }, data: { status: 'rejected', reviewedBy: BigInt(adminId as any | number), reviewNote, reviewedAt: new Date() } });
  await logModeration(adminId, 'edit_request', id, 'reject', reviewNote);
};

// Reviews
const getReviews = async ({ status, page = 1, limit = 10 }) => {
  const where: any = {};
  if (status) where.status = status;
  const skip = (parseInt(page as any) - 1) * parseInt(limit as any);
  const take = parseInt(limit as any);

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { place: { select: { id: true, name: true } }, user: { select: { id: true, name: true } } } }),
    prisma.review.count({ where }),
  ]);
  return { reviews, total, page: parseInt(page as any), limit: take };
};

const approveReview = async (id, adminId) => {
  const review = await prisma.review.update({
    where: { id: BigInt(id as any | number) },
    data: { status: 'approved', approvedBy: BigInt(adminId as any | number), approvedVia: 'manual', reviewedAt: new Date() },
  });
  await recalculateRating(review.placeId);
  await logModeration(adminId, 'review', id, 'approve');
  return review;
};

const rejectReview = async (id, adminId, rejectionReason) => {
  const review = await prisma.review.update({
    where: { id: BigInt(id as any | number) },
    data: { status: 'rejected', approvedBy: BigInt(adminId as any | number), rejectionReason, reviewedAt: new Date() },
  });
  await recalculateRating(review.placeId);
  await logModeration(adminId, 'review', id, 'reject', rejectionReason);
  return review;
};

// Photos
const getPhotos = async ({ status, page = 1, limit = 10 }) => {
  const where: any = {};
  if (status) where.status = status;
  const skip = (parseInt(page as any) - 1) * parseInt(limit as any);
  const take = parseInt(limit as any);

  const [photos, total] = await Promise.all([
    prisma.placePhoto.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { place: { select: { id: true, name: true } }, uploader: { select: { id: true, name: true } } } }),
    prisma.placePhoto.count({ where }),
  ]);
  return { photos, total, page: parseInt(page as any), limit: take };
};

const approvePhoto = async (id, adminId) => {
  const photo = await prisma.placePhoto.update({
    where: { id: BigInt(id as any | number) },
    data: { status: 'approved', approvedBy: BigInt(adminId as any | number), approvedVia: 'manual', reviewedAt: new Date() },
  });
  await logModeration(adminId, 'photo', id, 'approve');
  return photo;
};

const rejectPhoto = async (id, adminId, rejectionReason) => {
  const photo = await prisma.placePhoto.update({
    where: { id: BigInt(id as any | number) },
    data: { status: 'rejected', approvedBy: BigInt(adminId as any | number), rejectionReason, reviewedAt: new Date() },
  });
  await logModeration(adminId, 'photo', id, 'reject', rejectionReason);
  return photo;
};

// Moderation Logs
const getModerationLogs = async ({ page = 1, limit = 10 }) => {
  const skip = (parseInt(page as any) - 1) * parseInt(limit as any);
  const take = parseInt(limit as any);

  const [logs, total] = await Promise.all([
    prisma.moderationLog.findMany({ skip, take, orderBy: { createdAt: 'desc' }, include: { admin: { select: { id: true, name: true } } } }),
    prisma.moderationLog.count(),
  ]);
  return { logs, total, page: parseInt(page as any), limit: take };
};

const updatePlace = async (id, adminId, data) => {
  const place = await prisma.place.update({
    where: { id: BigInt(id as any | number) },
    data,
  });
  await logModeration(adminId, 'place', id, 'update', null, null, data);
  cacheService.del(cacheService.KEYS.PLACE_DETAIL(id));
  return place;
};

const deletePlace = async (id, adminId) => {
  await prisma.place.delete({
    where: { id: BigInt(id as any | number) },
  });
  await logModeration(adminId, 'place', id, 'delete', 'Hard delete by admin');
  cacheService.del(cacheService.KEYS.PLACE_DETAIL(id));
};

const createAdminUser = async (adminId, { name, email, password, phone }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    throw error;
  }
  const bcrypt = require('bcrypt');
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, phone, role: 'admin' },
    select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
  });

  await logModeration(adminId, 'user', user.id, 'create_admin', 'Created new admin user');
  return user;
};

export {
  getSettings, updateSettings,
  getPlaces, getPlaceById, approvePlace, rejectPlace, archivePlace, restorePlace, updatePlace, deletePlace,
  getReports, resolveReport,
  getEditRequests, approveEditRequest, rejectEditRequest,
  getReviews, approveReview, rejectReview,
  getPhotos, approvePhoto, rejectPhoto,
  getModerationLogs,
  createAdminUser,
};
