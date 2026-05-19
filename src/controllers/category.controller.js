const prisma = require('../config/prisma');
const { successResponse, errorResponse } = require('../utils/response');

const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return successResponse(res, categories, 'Categories retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = { getCategories };
