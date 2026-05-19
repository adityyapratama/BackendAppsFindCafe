const prisma = require('../config/prisma');
const { successResponse, errorResponse } = require('../utils/response');

const getFavorites = async (req, res, next) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: BigInt(req.user.id) },
      include: {
        place: {
          include: {
            category: { select: { name: true, slug: true } },
          },
        },
      },
    });

    return successResponse(res, favorites, 'Favorites retrieved');
  } catch (error) {
    next(error);
  }
};

const addFavorite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = BigInt(req.user.id);
    const placeId = BigInt(id);

    const existing = await prisma.favorite.findUnique({
      where: { userId_placeId: { userId, placeId } },
    });

    if (existing) {
      return errorResponse(res, 'Already in favorites');
    }

    await prisma.favorite.create({ data: { userId, placeId } });

    await prisma.place.update({
      where: { id: placeId },
      data: { favoriteCount: { increment: 1 } },
    });

    return successResponse(res, null, 'Added to favorites', 201);
  } catch (error) {
    next(error);
  }
};

const removeFavorite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = BigInt(req.user.id);
    const placeId = BigInt(id);

    await prisma.favorite.delete({
      where: { userId_placeId: { userId, placeId } },
    });

    await prisma.place.update({
      where: { id: placeId },
      data: { favoriteCount: { decrement: 1 } },
    });

    return successResponse(res, null, 'Removed from favorites');
  } catch (error) {
    next(error);
  }
};

module.exports = { getFavorites, addFavorite, removeFavorite };
