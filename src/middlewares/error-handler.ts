import type { FastifyInstance, FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { ApiError, ErrorCodes } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/**
 * Global error handler for the application
 */
export function setupErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError | ApiError | Error, request: FastifyRequest, reply: FastifyReply) => {
    const requestId = request.id || 'unknown';
    const log = logger.child({ requestId });

    // Handle multipart errors
    if ('code' in error && error.code === 'FST_REQ_FILE_TOO_LARGE') {
      log.warn('File too large');
      return reply.status(413).send({
        success: false,
        request_id: requestId,
        timestamp: new Date().toISOString(),
        error: {
          code: ErrorCodes.FILE_TOO_LARGE,
          message: 'File size exceeds maximum allowed size.',
        },
      });
    }

    // Handle rate limit errors
    if ('statusCode' in error && error.statusCode === 429) {
      log.warn('Rate limit exceeded');
      return reply.status(429).send({
        success: false,
        request_id: requestId,
        timestamp: new Date().toISOString(),
        error: {
          code: ErrorCodes.RATE_LIMIT_EXCEEDED,
          message: 'Too many requests. Please try again later.',
        },
      });
    }

    // Handle API errors
    if (error instanceof ApiError) {
      return reply.status(error.statusCode).send({
        success: false,
        request_id: requestId,
        timestamp: new Date().toISOString(),
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    }

    // Handle validation errors
    if ('validation' in error && error.validation) {
      log.warn({ validation: error.validation }, 'Validation error');
      return reply.status(400).send({
        success: false,
        request_id: requestId,
        timestamp: new Date().toISOString(),
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Request validation failed.',
          details: 'message' in error ? error.message : 'Unknown validation error',
        },
      });
    }

    // Log unexpected errors
    log.error({ error }, 'Unexpected error');

    // Generic error response
    return reply.status(500).send({
      success: false,
      request_id: requestId,
      timestamp: new Date().toISOString(),
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'An internal server error occurred.',
      },
    });
  });

  // Handle 404
  app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(404).send({
      success: false,
      request_id: 'not-found',
      timestamp: new Date().toISOString(),
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found.`,
      },
    });
  });
}
