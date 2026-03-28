import { describe, it, expect, vi } from 'vitest';
import { AnimalRecognitionResultSchema } from '../src/schemas/index.js';

// Mock config before importing the service
vi.mock('../src/config/index.js', () => ({
  config: {
    GEMINI_API_KEY: 'test-key',
    GEMINI_MODEL: 'gemini-2.5-flash',
    GEMINI_TIMEOUT_MS: 30000,
    GEMINI_MAX_RETRIES: 3,
    MAX_FILE_SIZE_MB: 10,
    LOG_LEVEL: 'error',
    NODE_ENV: 'test',
  },
}));

// Dynamic import after mocking
const { createMockAnimalResponse } = await import('../src/services/animal-recognition.service.js');

describe('Animal Recognition Service', () => {
  describe('createMockAnimalResponse', () => {
    it('should return valid mock response', () => {
      const mockResponse = createMockAnimalResponse();
      
      // Validate against schema
      const result = AnimalRecognitionResultSchema.safeParse(mockResponse);
      expect(result.success).toBe(true);
    });

    it('should have expected structure', () => {
      const mockResponse = createMockAnimalResponse();
      
      expect(mockResponse.likely_animal_name).toBe('Red Fox');
      expect(mockResponse.scientific_name).toBe('Vulpes vulpes');
      expect(mockResponse.category).toBe('mammal');
      expect(mockResponse.confidence_score).toBeGreaterThan(0);
      expect(mockResponse.confidence_score).toBeLessThanOrEqual(1);
      expect(mockResponse.is_wild_animal).toBe(true);
      expect(mockResponse.is_domestic_animal_possible).toBe(false);
      expect(mockResponse.possible_alternatives).toBeInstanceOf(Array);
      expect(mockResponse.visible_attributes).toBeInstanceOf(Array);
      expect(mockResponse.taxonomic_fallback).toBeDefined();
    });

    it('should have taxonomic fallback', () => {
      const mockResponse = createMockAnimalResponse();
      
      expect(mockResponse.taxonomic_fallback.species).toBe('Vulpes vulpes');
      expect(mockResponse.taxonomic_fallback.genus).toBe('Vulpes');
      expect(mockResponse.taxonomic_fallback.family).toBe('Canidae');
      expect(mockResponse.taxonomic_fallback.broader_group).toBe('fox');
    });

    it('should have safety note for wild animal', () => {
      const mockResponse = createMockAnimalResponse();
      
      expect(mockResponse.safety_note).toBeTruthy();
      expect(mockResponse.safety_note).toContain('Do not approach');
    });
  });
});
