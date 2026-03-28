import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { config } from './config/index.js';
import { registerRoutes } from './routes/index.js';
import { setupErrorHandler } from './middlewares/error-handler.js';
import { setupRequestLogging } from './middlewares/request-logger.js';
import { logger } from './utils/logger.js';

/**
 * Creates and configures the Fastify application
 */
export async function buildApp() {
  const app = Fastify({
    logger: false, // We use our own pino logger
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    genReqId: () => crypto.randomUUID(),
    bodyLimit: config.MAX_FILE_SIZE_MB * 1024 * 1024 + 1024, // Add buffer for form data
  });

  // Register CORS for frontend access
  await app.register(cors, {
    origin: true, // Allow all origins in development
    methods: ['GET', 'POST', 'OPTIONS'],
  });

  // Register multipart plugin for file uploads
  await app.register(multipart, {
    limits: {
      fileSize: config.MAX_FILE_SIZE_MB * 1024 * 1024,
      files: 1, // Only allow one file per request
    },
  });

  // Register rate limiting
  await app.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW_MS,
    errorResponseBuilder: () => ({
      success: false,
      request_id: 'rate-limited',
      timestamp: new Date().toISOString(),
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
      },
    }),
  });

  // Setup request logging
  setupRequestLogging(app);

  // Setup error handler
  setupErrorHandler(app);

  // Register routes
  await registerRoutes(app);

  return app;
}

/**
 * Starts the server
 */
async function start() {
  try {
    const app = await buildApp();

    await app.listen({
      port: config.PORT,
      host: config.HOST,
    });

    logger.info({
      port: config.PORT,
      host: config.HOST,
      env: config.NODE_ENV,
    }, '🚀 Animal Recognition API server started');

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Received shutdown signal');
      await app.close();
      logger.info('Server closed');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Start the server
start();
