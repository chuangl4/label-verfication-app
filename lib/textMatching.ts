import { ratio } from 'fuzzball';

/**
 * Fuzzy match threshold (0-100)
 * 80% similarity or higher is considered a match
 */
export const FUZZY_MATCH_THRESHOLD = 80;

/**
 * Normalize text for comparison
 * - Convert to lowercase
 * - Trim whitespace
 * - Normalize multiple spaces to single space
 * - Remove special characters (except %, ., -)
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s%.-]/g, ''); // Keep alphanumeric, %, ., -
}

/**
 * Perform fuzzy string matching using Levenshtein distance
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @returns Similarity score (0-100)
 */
export function fuzzyMatch(str1: string, str2: string): number {
  const normalized1 = normalizeText(str1);
  const normalized2 = normalizeText(str2);
  return ratio(normalized1, normalized2);
}

/**
 * Check if two strings match based on fuzzy threshold
 * @param str1 - First string
 * @param str2 - Second string
 * @param threshold - Minimum similarity score (default: 80)
 * @returns Whether strings match above threshold
 */
export function isMatch(
  str1: string,
  str2: string,
  threshold: number = FUZZY_MATCH_THRESHOLD
): boolean {
  return fuzzyMatch(str1, str2) >= threshold;
}

/**
 * Find alcohol content percentage in text
 * Looks for patterns like: "45%", "45% ABV", "45% Alc/Vol", "Alcohol 45%"
 * @param text - OCR extracted text
 * @returns Array of found percentages as numbers
 */
export function findAlcoholContent(text: string): number[] {
  const patterns = [
    /(\d+\.?\d*)\s*%\s*(ABV|alc\.?\/vol\.?|alcohol)?/gi,
    /(ABV|alc\.?\/vol\.?|alcohol)?\s*(\d+\.?\d*)\s*%/gi,
  ];

  const percentages: number[] = [];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const percentStr = match[1] || match[2];
      if (percentStr) {
        const percent = parseFloat(percentStr);
        if (!isNaN(percent) && percent >= 0 && percent <= 100) {
          percentages.push(percent);
        }
      }
    }
  }

  // Remove duplicates
  return [...new Set(percentages)];
}

/**
 * Find net contents/volume in text
 * Looks for patterns like: "750 mL", "12 fl oz", "1 L", "750ml"
 * @param text - OCR extracted text
 * @returns Array of found volume strings
 */
export function findNetContents(text: string): string[] {
  const patterns = [
    /(\d+\.?\d*)\s*(ml|mL|ML|milliliters?|l|L|liters?|litres?|oz|fl\.?\s*oz|ounces?|gallon|gal)/gi,
  ];

  const volumes: string[] = [];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      volumes.push(match[0].trim());
    }
  }

  return volumes;
}

/**
 * Normalize volume unit for comparison
 * Converts variations to standard format (e.g., mL, ml, ML → ml)
 */
export function normalizeVolumeUnit(volume: string): string {
  return volume
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/milliliters?/g, 'ml')
    .replace(/liters?|litres?/g, 'l')
    .replace(/fl\.?\s*oz/g, 'fl oz')
    .replace(/ounces?/g, 'oz')
    .replace(/gallon/g, 'gal');
}

/**
 * Check if government warning text is present
 * Looks for "GOVERNMENT WARNING" phrase (case-insensitive)
 * Optionally checks for key phrases like "Surgeon General", "pregnant"
 */
export function findGovernmentWarning(text: string): boolean {
  const normalizedText = text.toLowerCase();

  // Primary check: "GOVERNMENT WARNING" must be present
  const hasWarningPhrase = normalizedText.includes('government warning');

  if (!hasWarningPhrase) {
    return false;
  }

  // Optional: Additional validation for key warning phrases
  // const hasKeyPhrases = normalizedText.includes('surgeon general') ||
  //                       normalizedText.includes('pregnant') ||
  //                       normalizedText.includes('operating machinery');

  return hasWarningPhrase;
}

/**
 * Find best match for a string in OCR text
 * Useful when looking for brand name or product type anywhere in the text
 * @param searchTerm - The term to search for
 * @param ocrText - The full OCR text
 * @param threshold - Minimum similarity score
 * @returns Best matching substring and its score, or null if no match
 */
export function findBestMatch(
  searchTerm: string,
  ocrText: string,
  threshold: number = FUZZY_MATCH_THRESHOLD
): { match: string; score: number } | null {
  const normalizedSearch = normalizeText(searchTerm);
  const words = ocrText.split(/\s+/);

  let bestMatch: { match: string; score: number } | null = null;

  // Try matching against different window sizes
  for (let windowSize = 1; windowSize <= Math.min(10, words.length); windowSize++) {
    for (let i = 0; i <= words.length - windowSize; i++) {
      const window = words.slice(i, i + windowSize).join(' ');
      const score = fuzzyMatch(normalizedSearch, window);

      if (score >= threshold && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { match: window, score };
      }
    }
  }

  return bestMatch;
}
