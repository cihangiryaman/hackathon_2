import { SUPPORTED_MIME_TYPES, type FileValidationResult, type SupportedMimeType } from '../types/index.js';
import { config } from '../config/index.js';

const MAX_FILE_SIZE_BYTES = config.MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Validates an uploaded image file
 */
export function validateImageFile(
  buffer: Buffer | undefined,
  mimeType: string | undefined,
  filename: string | undefined
): FileValidationResult {
  // Check if file exists
  if (!buffer || buffer.length === 0) {
    return {
      valid: false,
      error: 'No file uploaded or file is empty. Please provide an image file.',
    };
  }

  // Check file size
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${config.MAX_FILE_SIZE_MB}MB. Your file is ${(buffer.length / (1024 * 1024)).toFixed(2)}MB.`,
    };
  }

  // Check mime type
  if (!mimeType) {
    return {
      valid: false,
      error: 'Could not determine file type. Please upload a valid image file.',
    };
  }

  const normalizedMimeType = mimeType.toLowerCase();
  if (!SUPPORTED_MIME_TYPES.includes(normalizedMimeType as SupportedMimeType)) {
    return {
      valid: false,
      error: `Unsupported file type: ${mimeType}. Supported types are: ${SUPPORTED_MIME_TYPES.join(', ')}.`,
    };
  }

  // Validate file extension matches mime type
  if (filename) {
    const extension = filename.toLowerCase().split('.').pop();
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    if (extension && !validExtensions.includes(extension)) {
      return {
        valid: false,
        error: `Invalid file extension: .${extension}. Supported extensions are: ${validExtensions.join(', ')}.`,
      };
    }
  }

  // Validate magic bytes for extra security
  const magicBytesValid = validateMagicBytes(buffer, normalizedMimeType);
  if (!magicBytesValid) {
    return {
      valid: false,
      error: 'File content does not match declared mime type. Please upload a valid image file.',
    };
  }

  return { valid: true };
}

/**
 * Validates file magic bytes match the declared mime type
 */
function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;

  // JPEG: starts with FF D8 FF
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }

  // PNG: starts with 89 50 4E 47 0D 0A 1A 0A
  if (mimeType === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4E &&
      buffer[3] === 0x47
    );
  }

  // WebP: starts with RIFF....WEBP
  if (mimeType === 'image/webp') {
    return (
      buffer[0] === 0x52 && // R
      buffer[1] === 0x49 && // I
      buffer[2] === 0x46 && // F
      buffer[3] === 0x46 && // F
      buffer.length >= 12 &&
      buffer[8] === 0x57 &&  // W
      buffer[9] === 0x45 &&  // E
      buffer[10] === 0x42 && // B
      buffer[11] === 0x50    // P
    );
  }

  return false;
}

/**
 * Normalizes mime type for consistent handling
 */
export function normalizeMimeType(mimeType: string): SupportedMimeType {
  const normalized = mimeType.toLowerCase();
  if (normalized === 'image/jpg') {
    return 'image/jpeg';
  }
  return normalized as SupportedMimeType;
}
