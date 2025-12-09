import Tesseract from 'tesseract.js';
import { OCRResult, MultiImageOCRResult } from '@/types';

/**
 * Extract text from an image using Tesseract OCR
 * @param imageData - Image as Buffer, base64 string, or file path
 * @returns OCR result with extracted text and confidence score
 */
export async function extractTextFromImage(
  imageData: Buffer | string
): Promise<OCRResult> {
  try {
    const result = await Tesseract.recognize(imageData, 'eng', {
      logger: (m) => {
        // Optional: log progress
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    return {
      text: result.data.text,
      confidence: result.data.confidence,
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from image. Please try a clearer image.');
  }
}

/**
 * Extract text from multiple images using Tesseract OCR
 * Processes each image individually and combines results
 * @param imageBuffers - Array of image buffers
 * @returns Combined OCR result with text from all images
 */
export async function extractTextFromMultipleImages(
  imageBuffers: Buffer[]
): Promise<MultiImageOCRResult> {
  const results: Array<{text: string; confidence: number; imageIndex: number}> = [];

  for (let i = 0; i < imageBuffers.length; i++) {
    try {
      console.log(`Processing image ${i + 1} of ${imageBuffers.length}...`);
      const result = await extractTextFromImage(imageBuffers[i]);
      results.push({
        text: result.text,
        confidence: result.confidence,
        imageIndex: i,
      });
    } catch (error) {
      console.error(`Failed to process image ${i + 1}:`, error);
      // Continue processing other images even if one fails
      results.push({
        text: '',
        confidence: 0,
        imageIndex: i,
      });
    }
  }

  // Combine all text with separators
  const combinedText = results
    .filter(r => r.text.trim().length > 0)
    .map(r => r.text)
    .join('\n\n--- IMAGE SEPARATOR ---\n\n');

  // Calculate average confidence (exclude failed images)
  const validResults = results.filter(r => r.confidence > 0);
  const averageConfidence = validResults.length > 0
    ? validResults.reduce((sum, r) => sum + r.confidence, 0) / validResults.length
    : 0;

  return {
    images: results,
    combinedText,
    averageConfidence,
  };
}

/**
 * Preprocess image for better OCR results (optional enhancement)
 * Could include: contrast adjustment, noise reduction, etc.
 * For now, we'll rely on Tesseract's built-in preprocessing
 */
export function preprocessImage(imageData: Buffer): Buffer {
  // Placeholder for future image preprocessing
  // Could use libraries like sharp or jimp
  return imageData;
}
