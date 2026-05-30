import prisma from '../config/prisma';
import * as cacheService from "./cache.service";

const getCategories = async () => {
  const cached = cacheService.get(cacheService.KEYS.CATEGORIES);
  if (cached) return cached;

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  cacheService.set(cacheService.KEYS.CATEGORIES, categories, cacheService.TTL.CATEGORIES);
  return categories;
};

const createCategory = async (data) => {
  const category = await prisma.category.create({ data });
  cacheService.del(cacheService.KEYS.CATEGORIES);
  return category;
};

const updateCategory = async (id, data) => {
  const category = await prisma.category.update({
    where: { id: parseInt(id, 10) },
    data,
  });
  cacheService.del(cacheService.KEYS.CATEGORIES);
  return category;
};

const deleteCategory = async (id) => {
  await prisma.category.delete({
    where: { id: parseInt(id, 10) },
  });
  cacheService.del(cacheService.KEYS.CATEGORIES);
};

export { getCategories, createCategory, updateCategory, deleteCategory };
