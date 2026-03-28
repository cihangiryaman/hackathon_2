import { geminiClient } from './gemini-client.js';
import { createNotAnAnimalResult, createImageQualityIssueResult } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { AnimalRecognitionResult, SupportedMimeType } from '../types/index.js';

/**
 * Main service for animal photo analysis
 * This is the reusable internal function for analyzing animal photos
 */
export async function analyzeAnimalPhoto(
  buffer: Buffer,
  mimeType: SupportedMimeType,
  requestId: string
): Promise<AnimalRecognitionResult> {
  const log = logger.child({ requestId, service: 'animal-recognition' });
  
  log.info({ 
    bufferSize: buffer.length,
    mimeType 
  }, 'Starting animal photo analysis');

  // Send to Gemini for analysis
  const geminiResponse = await geminiClient.analyzeImage(buffer, mimeType, requestId);
  
  log.info({
    isAnimal: geminiResponse.is_animal,
    confidence: geminiResponse.confidence_score,
    animal: geminiResponse.likely_animal_name,
  }, 'Gemini analysis complete');

  // Handle special cases
  
  // Case 1: Not an animal
  if (!geminiResponse.is_animal) {
    log.info('Image does not contain a recognizable animal');
    return createNotAnAnimalResult(
      geminiResponse.reasoning_summary || 'The image does not appear to contain an animal.'
    );
  }

  // Case 2: Image quality issues preventing identification
  if (
    geminiResponse.image_quality_issue && 
    geminiResponse.confidence_score < 0.3 &&
    geminiResponse.likely_animal_name === 'Unable to identify'
  ) {
    log.info({ issue: geminiResponse.image_quality_issue }, 'Image quality prevents identification');
    return createImageQualityIssueResult(geminiResponse.image_quality_issue);
  }

  // Case 3: Normal result - transform Gemini response to our format
  const result: AnimalRecognitionResult = {
    likely_animal_name: geminiResponse.likely_animal_name,
    scientific_name: geminiResponse.scientific_name,
    category: geminiResponse.category,
    confidence_score: geminiResponse.confidence_score,
    possible_alternatives: geminiResponse.possible_alternatives.slice(0, 5),
    visible_attributes: geminiResponse.visible_attributes,
    taxonomic_fallback: geminiResponse.taxonomic_fallback,
    is_wild_animal: geminiResponse.is_wild_animal,
    is_domestic_animal_possible: geminiResponse.is_domestic_animal_possible,
    distress_assessment: geminiResponse.distress_assessment,
    reasoning_summary: geminiResponse.reasoning_summary,
    uncertainty_note: geminiResponse.uncertainty_note,
    safety_note: geminiResponse.safety_note,
    requires_human_review: geminiResponse.requires_human_review,
  };

  // Additional safety checks
  
  // If confidence is very low but no human review flag, set it
  if (result.confidence_score < 0.3 && !result.requires_human_review) {
    result.requires_human_review = true;
    log.info('Setting requires_human_review due to low confidence');
  }

  // Flag for human review if animal is in significant distress
  if (
    result.distress_assessment.is_in_distress && 
    (result.distress_assessment.distress_severity === 'severe' || 
     result.distress_assessment.distress_severity === 'critical')
  ) {
    result.requires_human_review = true;
    log.info({ 
      severity: result.distress_assessment.distress_severity,
      category: result.distress_assessment.distress_category 
    }, 'Setting requires_human_review due to significant distress detected');
  }

  // Log distress assessment for monitoring
  if (result.distress_assessment.is_in_distress) {
    log.warn({
      severity: result.distress_assessment.distress_severity,
      category: result.distress_assessment.distress_category,
      indicators: result.distress_assessment.distress_indicators,
      immediateAction: result.distress_assessment.immediate_action_needed,
    }, 'Animal distress detected');
  }

  // Add safety note for potentially dangerous categories if missing
  if (
    !result.safety_note && 
    result.is_wild_animal && 
    result.confidence_score > 0.5
  ) {
    const dangerousKeywords = [
      'snake', 'spider', 'bear', 'wolf', 'lion', 'tiger', 'leopard', 
      'jaguar', 'crocodile', 'alligator', 'shark', 'scorpion', 
      'venomous', 'poisonous', 'wild boar', 'moose', 'bison'
    ];
    
    const animalLower = result.likely_animal_name.toLowerCase();
    const isMaybeAngerious = dangerousKeywords.some(keyword => 
      animalLower.includes(keyword)
    );
    
    if (isMaybeAngerious) {
      result.safety_note = 'This animal may be dangerous. Do not approach. Contact local wildlife authorities if you need assistance.';
    }
  }

  // Add safety warning for distressed animals if not already present
  if (
    result.distress_assessment.is_in_distress && 
    result.distress_assessment.distress_severity !== 'none' &&
    !result.safety_note
  ) {
    result.safety_note = 'This animal appears to be in distress. Do not attempt to handle it yourself as injured animals may bite or scratch. Contact local wildlife rescue or animal control services.';
  }

  return result;
}

/**
 * Creates a mock response for testing purposes
 */
export function createMockAnimalResponse(): AnimalRecognitionResult {
  return {
    likely_animal_name: 'Red Fox',
    scientific_name: 'Vulpes vulpes',
    category: 'mammal',
    confidence_score: 0.87,
    possible_alternatives: [
      {
        name: 'Gray Fox',
        scientific_name: 'Urocyon cinereoargenteus',
        confidence_score: 0.19,
      },
      {
        name: 'Kit Fox',
        scientific_name: 'Vulpes macrotis',
        confidence_score: 0.08,
      },
    ],
    visible_attributes: [
      'reddish-orange coat',
      'pointed ears',
      'long bushy tail with white tip',
      'black legs',
      'narrow muzzle',
    ],
    taxonomic_fallback: {
      species: 'Vulpes vulpes',
      genus: 'Vulpes',
      family: 'Canidae',
      broader_group: 'fox',
    },
    is_wild_animal: true,
    is_domestic_animal_possible: false,
    distress_assessment: {
      is_in_distress: false,
      distress_confidence: 0.95,
      distress_severity: 'none',
      distress_indicators: [],
      distress_category: 'none',
      immediate_action_needed: false,
      recommended_action: null,
    },
    reasoning_summary: 'The animal displays characteristic red fox features: reddish-orange fur, pointed ears, and a distinctive bushy tail with a white tip. Body proportions and facial structure are consistent with Vulpes vulpes. The animal appears healthy with no visible signs of distress or injury.',
    uncertainty_note: 'Species-level confidence is moderate because the image angle is partial and some diagnostic features are not fully visible.',
    safety_note: 'Do not approach or attempt to handle wild animals. Foxes can carry rabies. If you encounter an injured or distressed animal, contact local wildlife authorities.',
    requires_human_review: false,
  };
}
