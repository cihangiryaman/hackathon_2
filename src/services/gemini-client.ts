import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { config } from '../config/index.js';
import { GeminiAnimalResponseSchema, type GeminiAnimalResponse } from '../schemas/index.js';
import { buildAnimalRecognitionPrompt } from './prompt-builder.js';
import { ApiError, ErrorCodes } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { SupportedMimeType } from '../types/index.js';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

/**
 * Gemini client for animal recognition
 */
export class GeminiClient {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({
      model: config.GEMINI_MODEL,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2, // Lower temperature for more consistent, factual responses
        topP: 0.8,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        // Allow animal content which might include predators, etc.
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });
  }

  /**
   * Analyzes an image for animal recognition with retry logic
   */
  async analyzeImage(
    imageBuffer: Buffer,
    mimeType: SupportedMimeType,
    requestId: string
  ): Promise<GeminiAnimalResponse> {
    const log = logger.child({ requestId, service: 'gemini' });
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= config.GEMINI_MAX_RETRIES; attempt++) {
      try {
        log.info({ attempt }, 'Sending request to Gemini API');
        
        const result = await this.executeWithTimeout(
          this.sendToGemini(imageBuffer, mimeType),
          config.GEMINI_TIMEOUT_MS
        );
        
        log.info({ attempt }, 'Received response from Gemini API');
        
        // Parse and validate response
        const parsed = this.parseResponse(result, requestId);
        return parsed;
        
      } catch (error) {
        lastError = error as Error;
        log.warn({ attempt, error: lastError.message }, 'Gemini request failed');
        
        if (attempt < config.GEMINI_MAX_RETRIES) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted
    log.error({ error: lastError?.message }, 'All Gemini retries exhausted');
    
    if (lastError?.message.includes('timeout')) {
      throw new ApiError(
        ErrorCodes.GEMINI_TIMEOUT,
        'Animal recognition service timed out. Please try again.',
        undefined,
        504
      );
    }
    
    throw new ApiError(
      ErrorCodes.GEMINI_ERROR,
      'Failed to analyze image. Please try again later.',
      lastError?.message,
      502
    );
  }

  /**
   * Sends image to Gemini for analysis
   */
  private async sendToGemini(imageBuffer: Buffer, mimeType: SupportedMimeType): Promise<string> {
    const prompt = buildAnimalRecognitionPrompt();
    
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: mimeType,
      },
    };

    const result = await this.model.generateContent([prompt, imagePart]);
    const response = result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error('Empty response from Gemini');
    }
    
    return text;
  }

  /**
   * Parses and validates Gemini response
   */
  private parseResponse(text: string, requestId: string): GeminiAnimalResponse {
    const log = logger.child({ requestId, service: 'gemini-parser' });
    
    try {
      // Clean potential markdown code blocks
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.slice(7);
      }
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.slice(0, -3);
      }
      cleanedText = cleanedText.trim();
      
      const json = JSON.parse(cleanedText);
      const validated = GeminiAnimalResponseSchema.parse(json);
      
      return validated;
      
    } catch (error) {
      log.error({ error, responseText: text.substring(0, 500) }, 'Failed to parse Gemini response');
      throw new ApiError(
        ErrorCodes.PARSE_ERROR,
        'Failed to parse animal recognition response',
        'The AI returned an invalid response format',
        500
      );
    }
  }

  /**
   * Executes a promise with timeout
   */
  private async executeWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), timeoutMs)
      ),
    ]);
  }

  /**
   * Sleep utility for retry backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const geminiClient = new GeminiClient();
