import prisma from '../config/prisma';

const recommend = async (userId, placeId) => {
  const uid = BigInt(userId as any | number);
  const pid = BigInt(placeId as any | number);

  const existing = await prisma.placeRecommendation.findUnique({ where: { userId_placeId: { userId: uid, placeId: pid } } });
  if (existing) {
    const error = new Error('Already recommended');
    error.statusCode = 409;
    throw error;
  }

  await prisma.placeRecommendation.create({ data: { userId: uid, placeId: pid } });
  await prisma.place.update({ where: { id: pid }, data: { recommendationCount: { increment: 1 } } });
};

const unrecommend = async (userId, placeId) => {
  const uid = BigInt(userId as any | number);
  const pid = BigInt(placeId as any | number);

  await prisma.placeRecommendation.delete({ where: { userId_placeId: { userId: uid, placeId: pid } } });
  await prisma.place.update({ where: { id: pid }, data: { recommendationCount: { decrement: 1 } } });
};

export { recommend, unrecommend };
