const prisma = require('../config/prisma');
const { successResponse, errorResponse } = require('../utils/response');

const getReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const where = { placeId: BigInt(id), status: 'approved' };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return successResponse(res, reviews, 'Reviews retrieved', {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    next(error);
  }
};

const createReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const settings = await prisma.appSettings.findFirst();
    const approvalMode = settings?.reviewApprovalMode || 'auto';
    const status = approvalMode === 'auto' ? 'approved' : 'pending';
    const approvedVia = approvalMode === 'auto' ? 'auto' : null;

    const review = await prisma.review.create({
      data: {
        placeId: BigInt(id),
        userId: BigInt(req.user.id),
        rating,
        comment,
        status,
        approvedVia,
      },
    });

    if (status === 'approved') {
      const place = await prisma.place.findUnique({
        where: { id: BigInt(id) },
        select: { ratingCount: true, avgRating: true },
      });

      const newRatingCount = place.ratingCount + 1;
      const newAvgRating = (parseFloat(place.avgRating) * place.ratingCount + rating) / newRatingCount;

      await prisma.place.update({
        where: { id: BigInt(id) },
        data: { ratingCount: newRatingCount, avgRating: newAvgRating },
      });
    }

    return successResponse(res, review, 'Review submitted', 201);
  } catch (error) {
    if (error.code === 'P2002') {
      return errorResponse(res, 'You have already reviewed this place');
    }
    next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await prisma.review.findUnique({ where: { id: BigInt(id) } });
    if (!review || review.userId !== BigInt(req.user.id)) {
      return errorResponse(res, 'Review not found', null, 404);
    }

    const updated = await prisma.review.update({
      where: { id: BigInt(id) },
      data: { rating, comment },
    });

    return successResponse(res, updated, 'Review updated');
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({ where: { id: BigInt(id) } });
    if (!review || review.userId !== BigInt(req.user.id)) {
      return errorResponse(res, 'Review not found', null, 404);
    }

    await prisma.review.delete({ where: { id: BigInt(id) } });

    if (review.status === 'approved') {
      const place = await prisma.place.findUnique({
        where: { id: review.placeId },
        select: { ratingCount: true, avgRating: true },
      });

      if (place.ratingCount > 1) {
        const newRatingCount = place.ratingCount - 1;
        const newAvgRating =
          (parseFloat(place.avgRating) * place.ratingCount - review.rating) / newRatingCount;

        await prisma.place.update({
          where: { id: review.placeId },
          data: { ratingCount: newRatingCount, avgRating: newAvgRating },
        });
      } else {
        await prisma.place.update({
          where: { id: review.placeId },
          data: { ratingCount: 0, avgRating: 0 },
        });
      }
    }

    return successResponse(res, null, 'Review deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = { getReviews, createReview, updateReview, deleteReview };
