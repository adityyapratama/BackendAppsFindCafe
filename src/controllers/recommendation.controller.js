const prisma = require('../config/prisma');
const { successResponse, errorResponse } = require('../utils/response');

const recommendPlace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = BigInt(req.user.id);
    const placeId = BigInt(id);

    const existing = await prisma.placeRecommendation.findUnique({
      where: { userId_placeId: { userId, placeId } },
    });

    if (existing) {
      return errorResponse(res, 'Already recommended');
    }

    await prisma.placeRecommendation.create({ data: { userId, placeId } });

    await prisma.place.update({
      where: { id: placeId },
      data: { recommendationCount: { increment: 1 } },
    });

    return successResponse(res, null, 'Place recommended', 201);
  } catch (error) {
    next(error);
  }
};

const unrecommendPlace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = BigInt(req.user.id);
    const placeId = BigInt(id);

    await prisma.placeRecommendation.delete({
      where: { userId_placeId: { userId, placeId } },
    });

    await prisma.place.update({
      where: { id: placeId },
      data: { recommendationCount: { decrement: 1 } },
    });

    return successResponse(res, null, 'Recommendation removed');
  } catch (error) {
    next(error);
  }
};

module.exports = { recommendPlace, unrecommendPlace };
