require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ['error', 'warn'] });

const DATASET_MARKER = 'Data GIS: restoran_cafe.shp';
const CHUNK_SIZE = 500;

function slugify(name, index) {
  const base = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160) || 'place';
  return `${base}-${index}`;
}

async function main() {
  const dataPath = path.join(__dirname, '..', 'assets', 'dataset', 'places.json');
  const geoPath = path.join(__dirname, '..', 'assets', 'dataset', 'places_geocoded.json');
  const places = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const geocoded = fs.existsSync(geoPath) ? JSON.parse(fs.readFileSync(geoPath, 'utf-8')) : null;
  console.log(`Loaded ${places.length} places from dataset (geocoded: ${geocoded ? geocoded.filter((a) => a && a.length).length : 0})`);

  const category = await prisma.category.upsert({
    where: { slug: 'restoran' },
    update: {},
    create: {
      name: 'Restoran',
      slug: 'restoran',
      icon: 'utensils',
      description: 'Restoran dan cafe dari dataset GIS Surabaya',
      sortOrder: 6,
      isActive: true,
    },
  });
  console.log('Category ready:', category.slug, 'id:', category.id.toString());

  const deleted = await prisma.place.deleteMany({
    where: { description: { startsWith: DATASET_MARKER } },
  });
  console.log('Cleared previous dataset rows:', deleted.count);

  const FALLBACK_ADDR = 'Surabaya, Jawa Timur, Indonesia';
  const rows = places.map((p, i) => ({
    categoryId: category.id,
    name: p.name,
    slug: slugify(p.name, i),
    description: `${DATASET_MARKER} — Surabaya dataset`,
    address: (geocoded && geocoded[i]) || FALLBACK_ADDR,
    city: 'Surabaya',
    latitude: p.latitude,
    longitude: p.longitude,
    status: 'approved',
    approvedVia: 'manual',
    mapPinVerified: true,
    lastVerifiedAt: new Date(),
    reviewedAt: new Date(),
  }));

  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const res = await prisma.place.createMany({ data: chunk, skipDuplicates: true });
    inserted += res.count;
    if (i % 5000 === 0 || i + CHUNK_SIZE >= rows.length) {
      console.log(`Inserted ${inserted}/${rows.length}`);
    }
  }

  console.log(`Done. Inserted ${inserted} places.`);
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
