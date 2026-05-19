const prisma = require('../config/prisma');
const { successResponse, errorResponse } = require('../utils/response');

const getSettings = async (req, res, next) => {
  try {
    const settings = await prisma.appSettings.findFirst();
    if (!settings) {
      const newSettings = await prisma.appSettings.create({ data: {} });
      return successResponse(res, newSettings, 'Settings retrieved');
    }
    return successResponse(res, settings, 'Settings retrieved');
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { placeApprovalMode, reviewApprovalMode, photoApprovalMode, allowUserPlaceSubmission, allowUserReviews } = req.body;

    const existing = await prisma.appSettings.findFirst();
    const data = {
      placeApprovalMode,
      reviewApprovalMode,
      photoApprovalMode,
      allowUserPlaceSubmission,
      allowUserReviews,
      updatedBy: BigInt(req.user.id),
    };

    let settings;
    if (existing) {
      settings = await prisma.appSettings.update({
        where: { id: existing.id },
        data,
      });
    } else {
      settings = await prisma.appSettings.create({ data });
    }

    await prisma.moderationLog.create({
      data: {
        adminId: BigInt(req.user.id),
        targetType: 'setting',
        targetId: settings.id,
        action: 'update_setting',
        afterData: data,
      },
    });

    return successResponse(res, settings, 'Settings updated');
  } catch (error) {
    next(error);
  }
};

const getPlaces = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [places, total] = await Promise.all([
      prisma.place.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { name: true } },
          submitter: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.place.count({ where }),
    ]);

    return successResponse(res, places, 'Places retrieved', {
      total,
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

    const place = await prisma.place.findUnique({
      where: { id: BigInt(id) },
      include: {
        category: true,
        placeTags: { include: { tag: true } },
        openingHours: true,
        photos: true,
        reviews: true,
        editRequests: true,
        reports: true,
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

const approvePlace = async (req, res, next) => {
  try {
    const { id } = req.params;

    const place = await prisma.place.update({
      where: { id: BigInt(id) },
      data: {
        status: 'approved',
        approvedBy: BigInt(req.user.id),
        approvedVia: 'manual',
        reviewedAt: new Date(),
      },
    });

    await prisma.moderationLog.create({
      data: {
        adminId: BigInt(req.user.id),
        targetType: 'place',
        targetId: BigInt(id),
        action: 'approve',
      },
    });

    return successResponse(res, place, 'Place approved');
  } catch (error) {
    next(error);
  }
};

const rejectPlace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const place = await prisma.place.update({
      where: { id: BigInt(id) },
      data: {
        status: 'rejected',
        approvedBy: BigInt(req.user.id),
        rejectionReason,
        reviewedAt: new Date(),
      },
    });

    await prisma.moderationLog.create({
      data: {
        adminId: BigInt(req.user.id),
        targetType: 'place',
        targetId: BigInt(id),
        action: 'reject',
        note: rejectionReason,
      },
    });

    return successResponse(res, place, 'Place rejected');
  } catch (error) {
    next(error);
  }
};

const archivePlace = async (req, res, next) => {
  try {
    const { id } = req.params;

    const place = await prisma.place.update({
      where: { id: BigInt(id) },
      data: { status: 'archived' },
    });

    await prisma.moderationLog.create({
      data: {
        adminId: BigInt(req.user.id),
        targetType: 'place',
        targetId: BigInt(id),
        action: 'archive',
      },
    });

    return successResponse(res, place, 'Place archived');
  } catch (error) {
    next(error);
  }
};

const restorePlace = async (req, res, next) => {
  try {
    const { id } = req.params;

    const place = await prisma.place.update({
      where: { id: BigInt(id) },
      data: { status: 'pending' },
    });

    await prisma.moderationLog.create({
      data: {
        adminId: BigInt(req.user.id),
        targetType: 'place',
        targetId: BigInt(id),
        action: 'restore',
      },
    });

    return successResponse(res, place, 'Place restored');
  } catch (error) {
    next(error);
  }
};

const getReports = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const where = {};
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          place: { select: { id: true, name: true } },
          reporter: { select: { id: true, name: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return successResponse(res, reports, 'Reports retrieved', {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    next(error);
  }
};

const resolveReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolutionNote, status = 'resolved' } = req.body;

    const report = await prisma.report.update({
      where: { id: BigInt(id) },
      data: { status, resolutionNote, resolvedBy: BigInt(req.user.id), resolvedAt: new Date() },
    });

    await prisma.moderationLog.create({
      data: {
        adminId: BigInt(req.user.id),
        targetType: 'report',
        targetId: BigInt(id),
        action: 'resolve_report',
        note: resolutionNote,
      },
    });

    return successResponse(res, report, 'Report resolved');
  } catch (error) {
    next(error);
  }
};

const getEditRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const where = {};
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [editRequests, total] = await Promise.all([
      prisma.placeEditRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          place: { select: { id: true, name: true } },
          submitter: { select: { id: true, name: true } },
        },
      }),
      prisma.placeEditRequest.count({ where }),
    ]);

    return successResponse(res, editRequests, 'Edit requests retrieved', {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    next(error);
  }
};

const approveEditRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewNote } = req.body;

    const editRequest = await prisma.placeEditRequest.findUnique({
      where: { id: BigInt(id) },
      include: { place: true },
    });

    if (!editRequest) {
      return errorResponse(res, 'Edit request not found', null, 404);
    }

    await prisma.place.update({
      where: { id: editRequest.placeId },
      data: editRequest.proposedData,
    });

    await prisma.placeEditRequest.update({
      where: { id: BigInt(id) },
      data: { status: 'approved', reviewedBy: BigInt(req.user.id), reviewNote, reviewedAt: new Date() },
    });

    await prisma.moderationLog.create({
      data: {
        adminId: BigInt(req.user.id),
        targetType: 'edit_request',
        targetId: BigInt(id),
        action: 'approve',
        note: reviewNote,
        afterData: editRequest.proposedData,
      },
    });

    return successResponse(res, null, 'Edit request approved');
  } catch (error) {
    next(error);
  }
};

const rejectEditRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewNote } = req.body;

    await prisma.placeEditRequest.update({
      where: { id: BigInt(id) },
      data: { status: 'rejected', reviewedBy: BigInt(req.user.id), reviewNote, reviewedAt: new Date() },
    });

    await prisma.moderationLog.create({
      data: {
        adminId: BigInt(req.user.id),
        targetType: 'edit_request',
        targetId: BigInt(id),
        action: 'reject',
        note: reviewNote,
      },
    });

    return successResponse(res, null, 'Edit request rejected');
  } catch (error) {
    next(error);
  }
};

const getReviews = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const where = {};
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          place: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return successResponse(res, reviews, 'Reviews retrieved', {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    next(error);
  }
};

const approveReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.update({
      where: { id: BigInt(id) },
      data: { status: 'approved', approvedBy: BigInt(req.user.id), approvedVia: 'manual', reviewedAt: new Date() },
    });

    await prisma.moderationLog.create({
      data: {
        adminId: BigInt(req.user.id),
        targetType: 'review',
        targetId: BigInt(id),
        action: 'approve',
      },
    });

    return successResponse(res, review, 'Review approved');
  } catch (error) {
    next(error);
  }
};

const rejectReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const review = await prisma.review.update({
      where: { id: BigInt(id) },
      data: { status: 'rejected', approvedBy: BigInt(req.user.id), rejectionReason, reviewedAt: new Date() },
    });

    await prisma.moderationLog.create({
      data: {
        adminId: BigInt(req.user.id),
        targetType: 'review',
        targetId: BigInt(id),
        action: 'reject',
        note: rejectionReason,
      },
    });

    return successResponse(res, review, 'Review rejected');
  } catch (error) {
    next(error);
  }
};

const getPhotos = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const where = {};
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [photos, total] = await Promise.all([
      prisma.placePhoto.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          place: { select: { id: true, name: true } },
          uploader: { select: { id: true, name: true } },
        },
      }),
      prisma.placePhoto.count({ where }),
    ]);

    return successResponse(res, photos, 'Photos retrieved', {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    next(error);
  }
};

const approvePhoto = async (req, res, next) => {
  try {
    const { id } = req.params;

    const photo = await prisma.placePhoto.update({
      where: { id: BigInt(id) },
      data: { status: 'approved', approvedBy: BigInt(req.user.id), approvedVia: 'manual', reviewedAt: new Date() },
    });

    await prisma.moderationLog.create({
      data: {
        adminId: BigInt(req.user.id),
        targetType: 'photo',
        targetId: BigInt(id),
        action: 'approve',
      },
    });

    return successResponse(res, photo, 'Photo approved');
  } catch (error) {
    next(error);
  }
};

const rejectPhoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const photo = await prisma.placePhoto.update({
      where: { id: BigInt(id) },
      data: { status: 'rejected', approvedBy: BigInt(req.user.id), rejectionReason, reviewedAt: new Date() },
    });

    await prisma.moderationLog.create({
      data: {
        adminId: BigInt(req.user.id),
        targetType: 'photo',
        targetId: BigInt(id),
        action: 'reject',
        note: rejectionReason,
      },
    });

    return successResponse(res, photo, 'Photo rejected');
  } catch (error) {
    next(error);
  }
};

const getModerationLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [logs, total] = await Promise.all([
      prisma.moderationLog.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { id: true, name: true } },
        },
      }),
      prisma.moderationLog.count(),
    ]);

    return successResponse(res, logs, 'Moderation logs retrieved', {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getPlaces,
  getPlaceById,
  approvePlace,
  rejectPlace,
  archivePlace,
  restorePlace,
  getReports,
  resolveReport,
  getEditRequests,
  approveEditRequest,
  rejectEditRequest,
  getReviews,
  approveReview,
  rejectReview,
  getPhotos,
  approvePhoto,
  rejectPhoto,
  getModerationLogs,
};
