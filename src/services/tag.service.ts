import prisma from '../config/prisma';
import * as cacheService from "./cache.service";

const getTags = async (type) => {
  const cacheKey = type ? `${cacheService.KEYS.TAGS}:${type}` : cacheService.KEYS.TAGS;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  const where = type ? { type, isActive: true } : { isActive: true };
  const tags = await prisma.tag.findMany({ where, orderBy: { name: 'asc' } });

  cacheService.set(cacheKey, tags, cacheService.TTL.TAGS);
  return tags;
};

const createTag = async (data) => {
  const tag = await prisma.tag.create({ data });
  cacheService.invalidatePattern(cacheService.KEYS.TAGS); // Flush all tag caches
  return tag;
};

const updateTag = async (id, data) => {
  const tag = await prisma.tag.update({
    where: { id: parseInt(id, 10) },
    data,
  });
  cacheService.invalidatePattern(cacheService.KEYS.TAGS);
  return tag;
};

const deleteTag = async (id) => {
  await prisma.tag.delete({
    where: { id: parseInt(id, 10) },
  });
  cacheService.invalidatePattern(cacheService.KEYS.TAGS);
};

export { getTags, createTag, updateTag, deleteTag };
