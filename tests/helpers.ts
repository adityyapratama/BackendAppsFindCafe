import bcrypt from 'bcrypt';
import prisma from '../src/config/prisma';

export const uniqueSuffix = () => `${Date.now()}_${Math.floor(Math.random() * 100000)}`;

export const createAdminDirect = async (email: string) => {
  const passwordHash = await bcrypt.hash('AdminPass123', 10);
  return prisma.user.create({
    data: { name: 'Test Admin', email, passwordHash, role: 'admin' },
  });
};

export const createUserDirect = async (email: string, role: 'user' | 'admin' = 'user') => {
  const passwordHash = await bcrypt.hash('TestPass123', 10);
  return prisma.user.create({
    data: { name: 'Direct Test User', email, passwordHash, role },
  });
};

export const createApprovedPlaceDirect = async (overrides: Record<string, any> = {}) => {
  const slug = `test-place-${uniqueSuffix()}`;
  return prisma.place.create({
    data: {
      name: 'Test Approved Cafe',
      slug,
      address: 'Jl. Test No. 1',
      latitude: -7.25,
      longitude: 112.75,
      categoryId: 1n,
      status: 'approved',
      ...overrides,
    },
  });
};

export const deleteUserCascade = async (userId: bigint | number | string) => {
  await prisma.user.delete({ where: { id: BigInt(userId) } }).catch(() => {});
};

export const deletePlaceCascade = async (placeId: bigint | number | string) => {
  await prisma.place.delete({ where: { id: BigInt(placeId) } }).catch(() => {});
};

export { prisma };
