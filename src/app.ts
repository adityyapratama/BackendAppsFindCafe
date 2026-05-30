require('dotenv').config();
import { validateEnv } from './config/env';
validateEnv();
require('./utils/bigIntToJson');
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import routes from './routes';
import errorHandler from './middleware/errorHandler';
import { logger, httpLogger } from './middleware/logger';
import { connectDatabase } from './config/database';
import prisma from './config/prisma';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';

const app = express();

// Trust proxy (Render, Cloudflare, etc.)
app.set('trust proxy', 1);

app.use(helmet());

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

import sanitize from './middleware/sanitize';
app.use(sanitize);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Longgarkan untuk API umum
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/v1/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many authentication attempts from this IP, please try again later.',
});
app.use('/api/v1/auth/', authLimiter);

app.use(httpLogger);

// Swagger docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'Cafe Surabaya API Docs' }));
app.get('/docs.json', (req, res) => res.json(swaggerSpec));

app.get('/health', async (req, res) => {
  const dbHealthy = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
  const status = dbHealthy ? 200 : 503;
  res.status(status).json({
    success: dbHealthy,
    status: dbHealthy ? 'healthy' : 'degraded',
    database: dbHealthy,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1', routes);

// Redirect /api to /api/v1 for backward compat
app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  connectDatabase().then(() => {
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

    const shutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Server closed');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  });
}

export default app;
