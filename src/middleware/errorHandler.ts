import * as Sentry from '@sentry/node';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { AppError } from '../errors';
import { logger } from './logger';

const errorHandler = (err, req, res, next) => {
  Sentry.captureException(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large. Maximum size is 5MB.' : err.message;
    return res.status(400).json({
      success: false,
      message,
      errors: null,
    });
  }

  if (err instanceof SyntaxError && /Cannot convert .* to a BigInt/.test(err.message)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      errors: null,
    });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || null,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Conflict: Unique constraint failed',
        errors: { [err.meta?.target?.[0] || 'database']: ['Value already exists'] },
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }
    if (err.code === 'P2003') {
      return res.status(409).json({
        success: false,
        message: 'Conflict: Record is still referenced by other data',
        errors: null,
      });
    }
  }

  // Prisma driver adapter (pg) leaks FK/restrict violations as DriverAdapterError
  // instead of P2003; cause.code is a Postgres SQLSTATE (23503 = foreign key, 23001 = restrict)
  if (err.name === 'DriverAdapterError' && ['23503', '23001'].includes(err.cause?.code)) {
    return res.status(409).json({
      success: false,
      message: 'Conflict: Record is still referenced by other data',
      errors: null,
    });
  }

  logger.error({ err, method: req.method, url: req.originalUrl }, 'Unhandled error');
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
