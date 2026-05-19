const prisma = require('../config/prisma');

const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    console.log('Database disconnected successfully');
  } catch (error) {
    console.error('Database disconnection error:', error.message);
  }
};

module.exports = { connectDatabase, disconnectDatabase };
