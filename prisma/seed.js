require('dotenv').config();
const prisma = require('../src/config/prisma');

async function main() {
  console.log('Seeding database...');

  const categories = [
    { name: 'Coffee Shop', slug: 'coffee-shop', icon: 'coffee', sortOrder: 1 },
    { name: 'Cafe', slug: 'cafe', icon: 'cafe', sortOrder: 2 },
    { name: 'Roastery', slug: 'roastery', icon: 'roastery', sortOrder: 3 },
    { name: 'Co-working Space', slug: 'co-working-space', icon: 'coworking', sortOrder: 4 },
    { name: 'Bakery', slug: 'bakery', icon: 'bakery', sortOrder: 5 },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log('Categories seeded');

  const tags = [
    { name: 'WiFi', slug: 'wifi', type: 'facility' },
    { name: 'Parking', slug: 'parking', type: 'facility' },
    { name: 'Outdoor', slug: 'outdoor', type: 'facility' },
    { name: 'Smoking Area', slug: 'smoking-area', type: 'facility' },
    { name: 'Musik Live', slug: 'live-music', type: 'facility' },
    { name: 'Colokan', slug: 'power-outlet', type: 'facility' },
    { name: 'AC', slug: 'ac', type: 'facility' },
    { name: 'Pet Friendly', slug: 'pet-friendly', type: 'facility' },
    { name: 'Halal', slug: 'halal', type: 'facility' },
    { name: 'Kid Friendly', slug: 'kid-friendly', type: 'facility' },
    { name: 'Cozy', slug: 'cozy', type: 'vibe' },
    { name: 'Industrial', slug: 'industrial', type: 'vibe' },
    { name: 'Minimalis', slug: 'minimalist', type: 'vibe' },
    { name: 'Vintage', slug: 'vintage', type: 'vibe' },
    { name: 'Instagramable', slug: 'instagramable', type: 'vibe' },
    { name: 'Kopi Kerja', slug: 'work-friendly', type: 'purpose' },
    { name: 'Nongkrong', slug: 'hangout', type: 'purpose' },
    { name: 'Date', slug: 'date', type: 'purpose' },
    { name: 'Meeting', slug: 'meeting', type: 'purpose' },
    { name: 'Cashless', slug: 'cashless', type: 'payment' },
    { name: 'QRIS', slug: 'qris', type: 'payment' },
    { name: 'Cash Only', slug: 'cash-only', type: 'payment' },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
  }
  console.log('Tags seeded');

  await prisma.appSettings.upsert({
    where: { id: 1n },
    update: {},
    create: {
      placeApprovalMode: 'manual',
      reviewApprovalMode: 'auto',
      photoApprovalMode: 'manual',
      allowUserPlaceSubmission: true,
      allowUserReviews: true,
    },
  });
  console.log('App settings seeded');

  const adminPassword = await require('bcrypt').hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@cafesurabaya.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@cafesurabaya.com',
      passwordHash: adminPassword,
      role: 'admin',
      isActive: true,
    },
  });
  console.log('Admin user seeded');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
