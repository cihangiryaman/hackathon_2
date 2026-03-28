import pino from 'pino';
import { config } from '../config/index.js';

export const logger = pino({
  level: config.LOG_LEVEL,
  transport: config.NODE_ENV === 'development' 
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    service: 'animal-recognition-api',
    env: config.NODE_ENV,
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  // Never log raw image data
  redact: ['req.body.photo', 'imageBuffer', 'buffer'],
});

/**
 * Creates a child logger with request context
 */
export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}
