import prisma from '../config/prisma';

const getReviews = async (placeId, { page = 1, limit = 10 }) => {
  const where: any = { placeId: BigInt(placeId as any | number), status: 'approved' };
  const skip = (parseInt(page as any) - 1) * parseInt(limit as any);
  const take = parseInt(limit as any);

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where, skip, take,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    }),
    prisma.review.count({ where }),
  ]);

  return { reviews, total, page: parseInt(page as any), limit: take };
};

const createReview = async (placeId, userId, { rating, comment }) => {
  const settings = await prisma.appSettings.findFirst();
  const approvalMode = settings?.reviewApprovalMode || 'auto';
  const status = approvalMode === 'auto' ? 'approved' : 'pending';
  const approvedVia = approvalMode === 'auto' ? 'auto' : null;

  const review = await prisma.review.create({
    data: { placeId: BigInt(placeId as any | number), userId: BigInt(userId as any | number), rating, comment, status, approvedVia },
  });

  if (status === 'approved') {
    await recalculateRating(BigInt(placeId as any | number));
  }

  return review;
};

const updateReview = async (reviewId, userId, { rating, comment }) => {
  const review = await prisma.review.findUnique({ where: { id: BigInt(reviewId as any | number) } });
  if (!review) {
    const error = new Error('Review not found');
    error.statusCode = 404;
    throw error;
  }
  if (review.userId.toString() !== userId.toString()) {
    const error = new Error('Not authorized');
    error.statusCode = 403;
    throw error;
  }

  const updated = await prisma.review.update({
    where: { id: BigInt(reviewId as any | number) },
    data: { rating, comment },
  });

  if (review.status === 'approved') {
    await recalculateRating(review.placeId);
  }

  return updated;
};

const deleteReview = async (reviewId, userId) => {
  const review = await prisma.review.findUnique({ where: { id: BigInt(reviewId as any | number) } });
  if (!review) {
    const error = new Error('Review not found');
    error.statusCode = 404;
    throw error;
  }
  if (review.userId.toString() !== userId.toString()) {
    const error = new Error('Not authorized');
    error.statusCode = 403;
    throw error;
  }

  await prisma.review.delete({ where: { id: BigInt(reviewId as any | number) } });

  if (review.status === 'approved') {
    await recalculateRating(review.placeId);
  }
};

const recalculateRating = async (placeId) => {
  const stats = await prisma.review.aggregate({
    where: { placeId, status: 'approved' },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.place.update({
    where: { id: placeId },
    data: { avgRating: stats._avg.rating || 0, ratingCount: stats._count },
  });
};

export { getReviews, createReview, updateReview, deleteReview, recalculateRating };
