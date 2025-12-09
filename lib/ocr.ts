import Tesseract from 'tesseract.js';
import { OCRResult } from '@/types';

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
 * Preprocess image for better OCR results (optional enhancement)
 * Could include: contrast adjustment, noise reduction, etc.
 * For now, we'll rely on Tesseract's built-in preprocessing
 */
export function preprocessImage(imageData: Buffer): Buffer {
  // Placeholder for future image preprocessing
  // Could use libraries like sharp or jimp
  return imageData;
}
