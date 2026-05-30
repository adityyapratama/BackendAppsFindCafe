import prisma from '../config/prisma';
import { logger } from '../middleware/logger';

const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.fatal({ err: error }, 'Database connection failed');
    process.exit(1);
  }
};

const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error({ err: error }, 'Database disconnection error');
  }
};

export { connectDatabase, disconnectDatabase };
