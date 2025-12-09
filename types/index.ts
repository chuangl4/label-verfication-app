/**
 * Type definitions for the Label Verification App
 */

/**
 * Form data submitted by the user
 */
export interface FormData {
  brandName: string;
  productType: string;
  alcoholContent: number; // e.g., 45 for 45%
  netContents: string; // e.g., "750 mL"
}

/**
 * OCR extraction result
 */
export interface OCRResult {
  text: string; // Full extracted text from the image
  confidence: number; // Overall confidence score (0-100)
}

/**
 * Individual field verification result
 */
export interface FieldResult {
  matched: boolean; // Whether the field matched
  expected: string; // Value from the form
  found: string | null; // Value found in the OCR text
  similarity?: number; // Similarity score (0-100)
  error?: string; // Human-readable error message
}

/**
 * Complete verification result for all fields
 */
export interface VerificationResult {
  success: boolean; // Overall success (all fields matched)
  fields: {
    brandName: FieldResult;
    productType: FieldResult;
    alcoholContent: FieldResult;
    netContents: FieldResult;
    governmentWarning: FieldResult;
  };
}

/**
 * API request body for verification endpoint
 */
export interface VerifyRequest {
  brandName: string;
  productType: string;
  alcoholContent: string;
  netContents: string;
  image: string; // Base64 encoded image or file path
}

/**
 * API response from verification endpoint
 */
export interface VerifyResponse {
  success: boolean;
  fields: VerificationResult['fields'];
  method?: 'vision' | 'ocr'; // Which extraction method was used
  error?: string; // Error message if processing failed
}
