import prisma from '../config/prisma';

const getFavorites = async (userId, { page = 1, limit = 10 } = {}) => {
  const skip = (parseInt(page as any) - 1) * parseInt(limit as any);
  const take = parseInt(limit as any);
  const where: any = { userId: BigInt(userId as any | number) };

  const [favorites, total] = await Promise.all([
    prisma.favorite.findMany({
      where, skip, take,
      orderBy: { createdAt: 'desc' },
      include: { place: { include: { category: { select: { name: true, slug: true } } } } },
    }),
    prisma.favorite.count({ where }),
  ]);

  return { favorites, total, page: parseInt(page as any), limit: take, totalPages: Math.ceil(total / take) };
};

const addFavorite = async (userId, placeId) => {
  const uid = BigInt(userId as any | number);
  const pid = BigInt(placeId as any | number);

  const existing = await prisma.favorite.findUnique({ where: { userId_placeId: { userId: uid, placeId: pid } } });
  if (existing) {
    const error = new Error('Already in favorites');
    error.statusCode = 409;
    throw error;
  }

  await prisma.favorite.create({ data: { userId: uid, placeId: pid } });
  await prisma.place.update({ where: { id: pid }, data: { favoriteCount: { increment: 1 } } });
};

const removeFavorite = async (userId, placeId) => {
  const uid = BigInt(userId as any | number);
  const pid = BigInt(placeId as any | number);

  await prisma.favorite.delete({ where: { userId_placeId: { userId: uid, placeId: pid } } });
  await prisma.place.update({ where: { id: pid }, data: { favoriteCount: { decrement: 1 } } });
};

export { getFavorites, addFavorite, removeFavorite };
