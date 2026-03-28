import type { FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { analyzeAnimalPhoto } from '../services/animal-recognition.service.js';
import { validateImageFile, normalizeMimeType } from '../utils/file-validator.js';
import { ApiError, ErrorCodes } from '../utils/errors.js';
import { createRequestLogger } from '../utils/logger.js';
import type { ApiResponse, AnimalRecognitionResult } from '../types/index.js';

/**
 * Controller for animal recognition endpoint
 */
export async function recognizeAnimal(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<ApiResponse<AnimalRecognitionResult>> {
  const requestId = uuidv4();
  const timestamp = new Date().toISOString();
  const log = createRequestLogger(requestId);

  log.info('Animal recognition request received');

  try {
    // Get uploaded file from multipart
    const data = await request.file();

    if (!data) {
      log.warn('No file uploaded');
      throw new ApiError(
        ErrorCodes.FILE_REQUIRED,
        'No file uploaded. Please upload an image file with field name "photo".',
        undefined,
        400
      );
    }

    // Check field name
    if (data.fieldname !== 'photo') {
      log.warn({ fieldname: data.fieldname }, 'Wrong field name');
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        `Expected file field name "photo", but received "${data.fieldname}".`,
        undefined,
        400
      );
    }

    // Read file buffer
    const buffer = await data.toBuffer();
    const mimeType = data.mimetype;
    const filename = data.filename;

    log.info({ 
      filename,
      mimeType,
      size: buffer.length 
    }, 'File received');

    // Validate file
    const validation = validateImageFile(buffer, mimeType, filename);
    if (!validation.valid) {
      log.warn({ error: validation.error }, 'File validation failed');
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        validation.error!,
        undefined,
        400
      );
    }

    // Normalize mime type and analyze
    const normalizedMimeType = normalizeMimeType(mimeType);
    const result = await analyzeAnimalPhoto(buffer, normalizedMimeType, requestId);

    log.info({ 
      animal: result.likely_animal_name,
      confidence: result.confidence_score 
    }, 'Analysis complete');

    const response: ApiResponse<AnimalRecognitionResult> = {
      success: true,
      request_id: requestId,
      timestamp,
      result,
    };

    return reply.status(200).send(response);

  } catch (error) {
    // Handle known API errors
    if (error instanceof ApiError) {
      const response: ApiResponse<AnimalRecognitionResult> = {
        success: false,
        request_id: requestId,
        timestamp,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
      return reply.status(error.statusCode).send(response);
    }

    // Handle unexpected errors
    log.error({ error }, 'Unexpected error during animal recognition');
    
    const response: ApiResponse<AnimalRecognitionResult> = {
      success: false,
      request_id: requestId,
      timestamp,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'An unexpected error occurred. Please try again later.',
      },
    };
    return reply.status(500).send(response);
  }
}

/**
 * Health check controller
 */
export async function healthCheck(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<{ status: string; timestamp: string; service: string; version: string }> {
  return reply.status(200).send({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'animal-recognition-api',
    version: '1.0.0',
  });
}
