import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { logger } from '../middleware/logger';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const adapter = new PrismaPg(pool);

const logLevels = process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'];

const prisma = new PrismaClient({
  adapter,
  log: logLevels.map((level) => ({ level, emit: 'event' })) as any,
});

prisma.$on('query', (e: any) => {
  logger.debug({ duration: e.duration, query: e.query }, 'prisma:query');
});

prisma.$on('error', (e) => {
  logger.error({ target: e.target }, e.message);
});

prisma.$on('warn', (e) => {
  logger.warn({ target: e.target }, e.message);
});

export default prisma;
