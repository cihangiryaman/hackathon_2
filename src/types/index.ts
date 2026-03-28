/** Category of animal */
export type AnimalCategory = 
  | 'bird' 
  | 'mammal' 
  | 'reptile' 
  | 'amphibian' 
  | 'fish' 
  | 'insect' 
  | 'arachnid' 
  | 'unknown';

/** Distress severity levels */
export type DistressSeverity = 
  | 'none'
  | 'mild'
  | 'moderate'
  | 'severe'
  | 'critical';

/** Distress category types */
export type DistressCategory =
  | 'none'
  | 'injured'
  | 'trapped'
  | 'sick'
  | 'orphaned'
  | 'environmental_danger'
  | 'human_caused'
  | 'unknown';

/** Distress assessment for animal welfare */
export interface DistressAssessment {
  is_in_distress: boolean;
  distress_confidence: number;
  distress_severity: DistressSeverity;
  distress_indicators: string[];
  distress_category: DistressCategory;
  immediate_action_needed: boolean;
  recommended_action: string | null;
}

/** Alternative animal identification */
export interface AlternativeAnimal {
  name: string;
  scientific_name: string | null;
  confidence_score: number;
}

/** Taxonomic classification fallback */
export interface TaxonomicFallback {
  species: string | null;
  genus: string | null;
  family: string | null;
  broader_group: string | null;
}

/** Complete animal recognition result */
export interface AnimalRecognitionResult {
  likely_animal_name: string;
  scientific_name: string | null;
  category: AnimalCategory;
  confidence_score: number;
  possible_alternatives: AlternativeAnimal[];
  visible_attributes: string[];
  taxonomic_fallback: TaxonomicFallback;
  is_wild_animal: boolean;
  is_domestic_animal_possible: boolean;
  distress_assessment: DistressAssessment;
  reasoning_summary: string;
  uncertainty_note: string | null;
  safety_note: string | null;
  requires_human_review: boolean;
}

/** API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  request_id: string;
  timestamp: string;
  result?: T;
  error?: ApiError;
}

/** API error structure */
export interface ApiError {
  code: string;
  message: string;
  details?: string;
}

/** Supported MIME types for image upload */
export const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
] as const;

export type SupportedMimeType = typeof SUPPORTED_MIME_TYPES[number];

/** File validation result */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}
