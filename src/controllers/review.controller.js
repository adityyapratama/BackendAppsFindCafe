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

    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
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
        const aggregations = await tx.review.aggregate({
          _avg: { rating: true },
          _count: { rating: true },
          where: { placeId: BigInt(id), status: 'approved' },
        });

        await tx.place.update({
          where: { id: BigInt(id) },
          data: {
            ratingCount: aggregations._count.rating,
            avgRating: aggregations._avg.rating || 0,
          },
        });
      }
      return newReview;
    });

    return successResponse(res, review, 'Review submitted', 201);
  } catch (error) {
    if (error.code === 'P2002') {
      return errorResponse(res, 'You have already reviewed this place', null, 409);
    }
    next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const updated = await prisma.$transaction(async (tx) => {
      const review = await tx.review.findUnique({ where: { id: BigInt(id) } });
      if (!review || review.userId !== BigInt(req.user.id)) {
        throw new Error('Review_Not_Found');
      }

      const updatedReview = await tx.review.update({
        where: { id: BigInt(id) },
        data: { rating, comment },
      });

      if (updatedReview.status === 'approved') {
        const aggregations = await tx.review.aggregate({
          _avg: { rating: true },
          _count: { rating: true },
          where: { placeId: review.placeId, status: 'approved' },
        });

        await tx.place.update({
          where: { id: review.placeId },
          data: {
            ratingCount: aggregations._count.rating,
            avgRating: aggregations._avg.rating || 0,
          },
        });
      }
      return updatedReview;
    });

    return successResponse(res, updated, 'Review updated');
  } catch (error) {
    if (error.message === 'Review_Not_Found') {
      return errorResponse(res, 'Review not found or access denied', null, 404);
    }
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      const review = await tx.review.findUnique({ where: { id: BigInt(id) } });
      if (!review || review.userId !== BigInt(req.user.id)) {
        throw new Error('Review_Not_Found');
      }

      await tx.review.delete({ where: { id: BigInt(id) } });

      if (review.status === 'approved') {
        const aggregations = await tx.review.aggregate({
          _avg: { rating: true },
          _count: { rating: true },
          where: { placeId: review.placeId, status: 'approved' },
        });

        await tx.place.update({
          where: { id: review.placeId },
          data: {
            ratingCount: aggregations._count.rating,
            avgRating: aggregations._avg.rating || 0,
          },
        });
      }
    });

    return successResponse(res, null, 'Review deleted');
  } catch (error) {
    if (error.message === 'Review_Not_Found') {
      return errorResponse(res, 'Review not found or access denied', null, 404);
    }
    next(error);
  }
};

module.exports = { getReviews, createReview, updateReview, deleteReview };
