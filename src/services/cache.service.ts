import NodeCache from 'node-cache';

// stdTTL: default 5 minutes, checkperiod: cleanup every 10 minutes
const cache = new NodeCache({ stdTTL: 300, checkperiod: 600 });

const KEYS = {
  CATEGORIES: 'categories',
  TAGS: 'tags',
  PLACE_DETAIL: (id) => `place:${id}`,
  SETTINGS: 'app_settings',
};

const TTL = {
  CATEGORIES: 3600,   // 1 hour
  TAGS: 3600,         // 1 hour
  PLACE_DETAIL: 300,  // 5 minutes
  SETTINGS: 1800,     // 30 minutes
};

const get = (key) => cache.get(key);

const set = (key, value, ttl) => cache.set(key, value, ttl);

const del = (key) => cache.del(key);

const flush = () => cache.flushAll();

const invalidatePattern = (prefix) => {
  const keys = cache.keys().filter((k) => k.startsWith(prefix));
  if (keys.length) cache.del(keys);
};

export { cache, KEYS, TTL, get, set, del, flush, invalidatePattern };
