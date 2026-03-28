import type { AnimalRecognitionResult, DistressAssessment } from '../types/index.js';

/** Error codes for the API */
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FILE_REQUIRED: 'FILE_REQUIRED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  GEMINI_ERROR: 'GEMINI_ERROR',
  GEMINI_TIMEOUT: 'GEMINI_TIMEOUT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Creates a default "no distress" assessment
 */
export function createDefaultDistressAssessment(): DistressAssessment {
  return {
    is_in_distress: false,
    distress_confidence: 0,
    distress_severity: 'none',
    distress_indicators: [],
    distress_category: 'none',
    immediate_action_needed: false,
    recommended_action: null,
  };
}

/**
 * Creates an "unknown/unable to assess" distress assessment
 */
export function createUnknownDistressAssessment(): DistressAssessment {
  return {
    is_in_distress: false,
    distress_confidence: 0,
    distress_severity: 'none',
    distress_indicators: [],
    distress_category: 'unknown',
    immediate_action_needed: false,
    recommended_action: 'Unable to assess animal welfare from the provided image.',
  };
}

/**
 * Creates a "not an animal" result
 */
export function createNotAnAnimalResult(reason: string): AnimalRecognitionResult {
  return {
    likely_animal_name: 'Not an animal',
    scientific_name: null,
    category: 'unknown',
    confidence_score: 0,
    possible_alternatives: [],
    visible_attributes: [],
    taxonomic_fallback: {
      species: null,
      genus: null,
      family: null,
      broader_group: null,
    },
    is_wild_animal: false,
    is_domestic_animal_possible: false,
    distress_assessment: createDefaultDistressAssessment(),
    reasoning_summary: reason,
    uncertainty_note: 'The image does not appear to contain a recognizable animal.',
    safety_note: null,
    requires_human_review: true,
  };
}

/**
 * Creates an image quality issue result
 */
export function createImageQualityIssueResult(issue: string): AnimalRecognitionResult {
  return {
    likely_animal_name: 'Unable to identify',
    scientific_name: null,
    category: 'unknown',
    confidence_score: 0,
    possible_alternatives: [],
    visible_attributes: [],
    taxonomic_fallback: {
      species: null,
      genus: null,
      family: null,
      broader_group: null,
    },
    is_wild_animal: false,
    is_domestic_animal_possible: false,
    distress_assessment: createUnknownDistressAssessment(),
    reasoning_summary: `Image quality issue: ${issue}`,
    uncertainty_note: issue,
    safety_note: null,
    requires_human_review: true,
  };
}
