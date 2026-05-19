const prisma = require('../config/prisma');
const { successResponse, errorResponse } = require('../utils/response');

const getTags = async (req, res, next) => {
  try {
    const { type } = req.query;
    const where = { isActive: true };
    if (type) where.type = type;

    const tags = await prisma.tag.findMany({ where, orderBy: { name: 'asc' } });

    return successResponse(res, tags, 'Tags retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = { getTags };
