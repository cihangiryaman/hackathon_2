import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger.js';

/**
 * Sets up request logging middleware
 */
export function setupRequestLogging(app: FastifyInstance): void {
  // Log incoming requests
  app.addHook('onRequest', async (request: FastifyRequest) => {
    const log = logger.child({ 
      requestId: request.id,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });
    
    log.info('Incoming request');
  });

  // Log response
  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const log = logger.child({
      requestId: request.id,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime,
    });

    if (reply.statusCode >= 500) {
      log.error('Request failed');
    } else if (reply.statusCode >= 400) {
      log.warn('Request error');
    } else {
      log.info('Request completed');
    }
  });
}
