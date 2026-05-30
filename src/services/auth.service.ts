import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN as any,
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id, type: 'refresh' }, process.env.JWT_SECRET as string, {
    expiresIn: '30d',
  });
};

const register = async ({ name, email, password, phone }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    error.errors = { email: ['Email already registered'] };
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, phone },
    select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
  });

  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  });

  return { ...user, token, refreshToken };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  });

  return { token, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

const refresh = async (refreshToken) => {
  const record = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    const error = new Error('Invalid refresh token');
    error.statusCode = 401;
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { id: record.userId } });
  if (!user || !user.isActive) {
    const error = new Error('User not found');
    error.statusCode = 401;
    throw error;
  }

  // Rotate refresh token
  await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });

  const newToken = generateToken(user);
  const newRefreshToken = generateRefreshToken(user);

  await prisma.refreshToken.create({
    data: { userId: user.id, token: newRefreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  });

  return { token: newToken, refreshToken: newRefreshToken };
};

const logout = async (refreshToken) => {
  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
};

const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, isActive: true, createdAt: true },
  });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

const updateProfile = async (userId, data) => {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, updatedAt: true },
  });
};

export { register, login, refresh, logout, getProfile, updateProfile };
