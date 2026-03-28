import { describe, it, expect } from 'vitest';
import { 
  AnimalRecognitionResultSchema, 
  GeminiAnimalResponseSchema,
  AlternativeAnimalSchema,
  TaxonomicFallbackSchema,
  DistressAssessmentSchema,
} from '../src/schemas/index.js';

// Helper to create a valid distress assessment
const validDistressAssessment = {
  is_in_distress: false,
  distress_confidence: 0.95,
  distress_severity: 'none',
  distress_indicators: [],
  distress_category: 'none',
  immediate_action_needed: false,
  recommended_action: null,
};

describe('Schemas', () => {
  describe('AlternativeAnimalSchema', () => {
    it('should validate valid alternative', () => {
      const valid = {
        name: 'Gray Fox',
        scientific_name: 'Urocyon cinereoargenteus',
        confidence_score: 0.19,
      };
      expect(AlternativeAnimalSchema.safeParse(valid).success).toBe(true);
    });

    it('should allow null scientific_name', () => {
      const valid = {
        name: 'Unknown Fox',
        scientific_name: null,
        confidence_score: 0.1,
      };
      expect(AlternativeAnimalSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject confidence > 1', () => {
      const invalid = {
        name: 'Fox',
        scientific_name: null,
        confidence_score: 1.5,
      };
      expect(AlternativeAnimalSchema.safeParse(invalid).success).toBe(false);
    });

    it('should reject confidence < 0', () => {
      const invalid = {
        name: 'Fox',
        scientific_name: null,
        confidence_score: -0.1,
      };
      expect(AlternativeAnimalSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('TaxonomicFallbackSchema', () => {
    it('should validate complete taxonomy', () => {
      const valid = {
        species: 'Vulpes vulpes',
        genus: 'Vulpes',
        family: 'Canidae',
        broader_group: 'fox',
      };
      expect(TaxonomicFallbackSchema.safeParse(valid).success).toBe(true);
    });

    it('should allow all nulls', () => {
      const valid = {
        species: null,
        genus: null,
        family: null,
        broader_group: null,
      };
      expect(TaxonomicFallbackSchema.safeParse(valid).success).toBe(true);
    });
  });

  describe('DistressAssessmentSchema', () => {
    it('should validate healthy animal assessment', () => {
      expect(DistressAssessmentSchema.safeParse(validDistressAssessment).success).toBe(true);
    });

    it('should validate distressed animal assessment', () => {
      const distressed = {
        is_in_distress: true,
        distress_confidence: 0.85,
        distress_severity: 'severe',
        distress_indicators: ['visible wound', 'limping'],
        distress_category: 'injured',
        immediate_action_needed: true,
        recommended_action: 'Contact wildlife rescue immediately.',
      };
      expect(DistressAssessmentSchema.safeParse(distressed).success).toBe(true);
    });

    it('should reject invalid severity', () => {
      const invalid = {
        ...validDistressAssessment,
        distress_severity: 'extreme', // Invalid
      };
      expect(DistressAssessmentSchema.safeParse(invalid).success).toBe(false);
    });

    it('should reject invalid category', () => {
      const invalid = {
        ...validDistressAssessment,
        distress_category: 'attacked', // Invalid
      };
      expect(DistressAssessmentSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('AnimalRecognitionResultSchema', () => {
    it('should validate complete result', () => {
      const valid = {
        likely_animal_name: 'Red Fox',
        scientific_name: 'Vulpes vulpes',
        category: 'mammal',
        confidence_score: 0.87,
        possible_alternatives: [],
        visible_attributes: ['red fur'],
        taxonomic_fallback: {
          species: 'Vulpes vulpes',
          genus: 'Vulpes',
          family: 'Canidae',
          broader_group: 'fox',
        },
        is_wild_animal: true,
        is_domestic_animal_possible: false,
        distress_assessment: validDistressAssessment,
        reasoning_summary: 'This is a fox.',
        uncertainty_note: null,
        safety_note: 'Do not approach.',
        requires_human_review: false,
      };
      expect(AnimalRecognitionResultSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject invalid category', () => {
      const invalid = {
        likely_animal_name: 'Red Fox',
        scientific_name: 'Vulpes vulpes',
        category: 'dinosaur', // Invalid!
        confidence_score: 0.87,
        possible_alternatives: [],
        visible_attributes: [],
        taxonomic_fallback: {
          species: null,
          genus: null,
          family: null,
          broader_group: null,
        },
        is_wild_animal: true,
        is_domestic_animal_possible: false,
        distress_assessment: validDistressAssessment,
        reasoning_summary: 'Test',
        uncertainty_note: null,
        safety_note: null,
        requires_human_review: false,
      };
      expect(AnimalRecognitionResultSchema.safeParse(invalid).success).toBe(false);
    });

    it('should limit alternatives to 5', () => {
      const valid = {
        likely_animal_name: 'Fox',
        scientific_name: null,
        category: 'mammal',
        confidence_score: 0.5,
        possible_alternatives: Array(5).fill({
          name: 'Alt',
          scientific_name: null,
          confidence_score: 0.1,
        }),
        visible_attributes: [],
        taxonomic_fallback: {
          species: null,
          genus: null,
          family: null,
          broader_group: null,
        },
        is_wild_animal: true,
        is_domestic_animal_possible: false,
        distress_assessment: validDistressAssessment,
        reasoning_summary: 'Test',
        uncertainty_note: null,
        safety_note: null,
        requires_human_review: false,
      };
      expect(AnimalRecognitionResultSchema.safeParse(valid).success).toBe(true);
    });
  });

  describe('GeminiAnimalResponseSchema', () => {
    it('should validate response with is_animal field', () => {
      const valid = {
        is_animal: true,
        image_quality_issue: null,
        likely_animal_name: 'Red Fox',
        scientific_name: 'Vulpes vulpes',
        category: 'mammal',
        confidence_score: 0.87,
        possible_alternatives: [],
        visible_attributes: ['red fur'],
        taxonomic_fallback: {
          species: 'Vulpes vulpes',
          genus: 'Vulpes',
          family: 'Canidae',
          broader_group: 'fox',
        },
        is_wild_animal: true,
        is_domestic_animal_possible: false,
        distress_assessment: validDistressAssessment,
        reasoning_summary: 'This is a fox.',
        uncertainty_note: null,
        safety_note: 'Do not approach.',
        requires_human_review: false,
      };
      expect(GeminiAnimalResponseSchema.safeParse(valid).success).toBe(true);
    });

    it('should default is_animal to true', () => {
      const input = {
        likely_animal_name: 'Red Fox',
        scientific_name: 'Vulpes vulpes',
        category: 'mammal',
        confidence_score: 0.87,
        possible_alternatives: [],
        visible_attributes: [],
        taxonomic_fallback: {
          species: null,
          genus: null,
          family: null,
          broader_group: null,
        },
        is_wild_animal: true,
        is_domestic_animal_possible: false,
        distress_assessment: validDistressAssessment,
        reasoning_summary: 'Test',
        uncertainty_note: null,
        safety_note: null,
        requires_human_review: false,
      };
      const result = GeminiAnimalResponseSchema.parse(input);
      expect(result.is_animal).toBe(true);
    });
  });
});
