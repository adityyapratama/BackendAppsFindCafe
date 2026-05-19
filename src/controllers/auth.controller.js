const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { successResponse, errorResponse } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse(res, 'Email already registered', { email: ['Email already registered'] });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, phone },
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    return successResponse(res, { ...user, token }, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return errorResponse(res, 'Invalid credentials', { email: ['Invalid email or password'] });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return errorResponse(res, 'Invalid credentials', { email: ['Invalid email or password'] });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    return successResponse(res, { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, isActive: true, createdAt: true },
    });

    if (!user) {
      return errorResponse(res, 'User not found', null, 404);
    }

    return successResponse(res, user, 'User profile retrieved');
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    return successResponse(res, null, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, logout };
