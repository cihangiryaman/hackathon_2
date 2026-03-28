import type { FastifyInstance } from 'fastify';
import { recognizeAnimal, healthCheck } from '../controllers/animal-recognition.controller.js';

/**
 * Registers all API routes
 */
export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // Health check endpoint
  app.get('/health', healthCheck);

  // API v1 routes
  app.register(async (v1) => {
    // Animal recognition endpoint
    v1.post('/animal-recognition', recognizeAnimal);
  }, { prefix: '/api/v1' });
}
