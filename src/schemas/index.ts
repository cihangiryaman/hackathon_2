import { z } from 'zod';

/** Animal category enum */
export const AnimalCategorySchema = z.enum([
  'bird',
  'mammal', 
  'reptile',
  'amphibian',
  'fish',
  'insect',
  'arachnid',
  'unknown',
]);

/** Distress severity enum */
export const DistressSeveritySchema = z.enum([
  'none',
  'mild',
  'moderate',
  'severe',
  'critical',
]);

/** Distress category enum */
export const DistressCategorySchema = z.enum([
  'none',
  'injured',
  'trapped',
  'sick',
  'orphaned',
  'environmental_danger',
  'human_caused',
  'unknown',
]);

/** Distress assessment schema */
export const DistressAssessmentSchema = z.object({
  is_in_distress: z.boolean(),
  distress_confidence: z.number().min(0).max(1),
  distress_severity: DistressSeveritySchema,
  distress_indicators: z.array(z.string()),
  distress_category: DistressCategorySchema,
  immediate_action_needed: z.boolean(),
  recommended_action: z.string().nullable(),
});

/** Alternative animal schema */
export const AlternativeAnimalSchema = z.object({
  name: z.string(),
  scientific_name: z.string().nullable(),
  confidence_score: z.number().min(0).max(1),
});

/** Taxonomic fallback schema */
export const TaxonomicFallbackSchema = z.object({
  species: z.string().nullable(),
  genus: z.string().nullable(),
  family: z.string().nullable(),
  broader_group: z.string().nullable(),
});

/** Complete animal recognition result schema */
export const AnimalRecognitionResultSchema = z.object({
  likely_animal_name: z.string(),
  scientific_name: z.string().nullable(),
  category: AnimalCategorySchema,
  confidence_score: z.number().min(0).max(1),
  possible_alternatives: z.array(AlternativeAnimalSchema).max(5),
  visible_attributes: z.array(z.string()),
  taxonomic_fallback: TaxonomicFallbackSchema,
  is_wild_animal: z.boolean(),
  is_domestic_animal_possible: z.boolean(),
  distress_assessment: DistressAssessmentSchema,
  reasoning_summary: z.string(),
  uncertainty_note: z.string().nullable(),
  safety_note: z.string().nullable(),
  requires_human_review: z.boolean(),
});

/** API error schema */
export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.string().optional(),
});

/** Success response schema */
export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  request_id: z.string().uuid(),
  timestamp: z.string().datetime(),
  result: AnimalRecognitionResultSchema,
});

/** Error response schema */
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  request_id: z.string().uuid(),
  timestamp: z.string().datetime(),
  error: ApiErrorSchema,
});

/** Union of all response types */
export const ApiResponseSchema = z.union([SuccessResponseSchema, ErrorResponseSchema]);

/** Gemini response schema - what we expect from the AI */
export const GeminiAnimalResponseSchema = z.object({
  likely_animal_name: z.string(),
  scientific_name: z.string().nullable(),
  category: AnimalCategorySchema,
  confidence_score: z.number().min(0).max(1),
  possible_alternatives: z.array(AlternativeAnimalSchema).max(5).default([]),
  visible_attributes: z.array(z.string()).default([]),
  taxonomic_fallback: TaxonomicFallbackSchema,
  is_wild_animal: z.boolean(),
  is_domestic_animal_possible: z.boolean(),
  distress_assessment: DistressAssessmentSchema,
  reasoning_summary: z.string(),
  uncertainty_note: z.string().nullable(),
  safety_note: z.string().nullable(),
  requires_human_review: z.boolean(),
  is_animal: z.boolean().default(true),
  image_quality_issue: z.string().nullable().default(null),
});

export type GeminiAnimalResponse = z.infer<typeof GeminiAnimalResponseSchema>;
export type DistressAssessment = z.infer<typeof DistressAssessmentSchema>;
export type DistressSeverity = z.infer<typeof DistressSeveritySchema>;
export type DistressCategory = z.infer<typeof DistressCategorySchema>;
