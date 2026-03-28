import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateImageFile, normalizeMimeType } from '../src/utils/file-validator.js';

// Mock config
vi.mock('../src/config/index.js', () => ({
  config: {
    MAX_FILE_SIZE_MB: 10,
  },
}));

describe('File Validator', () => {
  describe('validateImageFile', () => {
    // Valid JPEG magic bytes
    const validJpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, ...Array(100).fill(0)]);
    // Valid PNG magic bytes
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, ...Array(100).fill(0)]);
    // Valid WebP magic bytes
    const validWebpBuffer = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, ...Array(100).fill(0)]);

    it('should accept valid JPEG file', () => {
      const result = validateImageFile(validJpegBuffer, 'image/jpeg', 'test.jpg');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid PNG file', () => {
      const result = validateImageFile(validPngBuffer, 'image/png', 'test.png');
      expect(result.valid).toBe(true);
    });

    it('should accept valid WebP file', () => {
      const result = validateImageFile(validWebpBuffer, 'image/webp', 'test.webp');
      expect(result.valid).toBe(true);
    });

    it('should reject empty buffer', () => {
      const result = validateImageFile(Buffer.from([]), 'image/jpeg', 'test.jpg');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('No file uploaded');
    });

    it('should reject undefined buffer', () => {
      const result = validateImageFile(undefined, 'image/jpeg', 'test.jpg');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('No file uploaded');
    });

    it('should reject unsupported mime type', () => {
      const result = validateImageFile(validJpegBuffer, 'image/gif', 'test.gif');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });

    it('should reject missing mime type', () => {
      const result = validateImageFile(validJpegBuffer, undefined, 'test.jpg');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Could not determine file type');
    });

    it('should reject mismatched magic bytes', () => {
      // PNG magic bytes but JPEG mime type
      const result = validateImageFile(validPngBuffer, 'image/jpeg', 'test.jpg');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File content does not match');
    });

    it('should reject invalid file extension', () => {
      const result = validateImageFile(validJpegBuffer, 'image/jpeg', 'test.gif');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file extension');
    });
  });

  describe('normalizeMimeType', () => {
    it('should normalize image/jpg to image/jpeg', () => {
      expect(normalizeMimeType('image/jpg')).toBe('image/jpeg');
    });

    it('should pass through image/jpeg unchanged', () => {
      expect(normalizeMimeType('image/jpeg')).toBe('image/jpeg');
    });

    it('should pass through image/png unchanged', () => {
      expect(normalizeMimeType('image/png')).toBe('image/png');
    });
  });
});
