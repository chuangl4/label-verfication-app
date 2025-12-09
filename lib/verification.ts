import { FormData, FieldResult, VerificationResult } from '@/types';
import {
  findBestMatch,
  findAlcoholContent,
  findNetContents,
  findGovernmentWarning,
  normalizeVolumeUnit,
  fuzzyMatch,
  FUZZY_MATCH_THRESHOLD,
} from './textMatching';
import { classifyProductType, categoriesMatch } from './productTypeClassifier';

/**
 * Verify brand name against OCR text
 */
export function verifyBrandName(
  formValue: string,
  ocrText: string
): FieldResult {
  const match = findBestMatch(formValue, ocrText);

  if (match && match.score >= FUZZY_MATCH_THRESHOLD) {
    return {
      matched: true,
      expected: formValue,
      found: match.match,
      similarity: match.score,
    };
  }

  return {
    matched: false,
    expected: formValue,
    found: match?.match || null,
    similarity: match?.score,
    error: match
      ? `Brand name mismatch: Found "${match.match}" (${match.score}% similarity, threshold ${FUZZY_MATCH_THRESHOLD}%)`
      : `Brand name "${formValue}" not found on label`,
  };
}

/**
 * Verify product type/class against OCR text using TTB category classification
 * The form value should be one of: Wine, Distilled Spirits, or Malt Beverage
 */
export function verifyProductType(
  expectedCategory: string,
  ocrText: string
): FieldResult {
  // Try to find the product type description in OCR text
  const match = findBestMatch(expectedCategory, ocrText);

  // If we find a fuzzy match for the category itself (e.g., "Wine" in text), that's good
  if (match && match.score >= FUZZY_MATCH_THRESHOLD) {
    return {
      matched: true,
      expected: expectedCategory,
      found: match.match,
      similarity: match.score,
    };
  }

  // Otherwise, try to classify what we found in the OCR text
  // Look for product descriptions (e.g., "Bourbon", "IPA", "Cabernet")
  // Try to extract a product type description from the text (heuristic: look for common patterns)
  const productTypePattern = /(?:^|\s)((?:kentucky\s+)?(?:straight\s+)?(?:bourbon|whiskey|whisky|vodka|gin|rum|tequila|wine|beer|ale|lager|ipa|stout|porter|cabernet|merlot|chardonnay|pinot|sauvignon)[^\n]*?)(?:\n|$)/i;
  const foundProduct = ocrText.match(productTypePattern);

  if (foundProduct && foundProduct[1]) {
    const productDescription = foundProduct[1].trim();
    const classification = classifyProductType(productDescription);

    if (classification.category && classification.confidence >= 70) {
      // We found and classified a product type
      if (categoriesMatch(expectedCategory, classification.category)) {
        return {
          matched: true,
          expected: expectedCategory,
          found: `${productDescription} (${classification.category})`,
          similarity: classification.confidence,
        };
      } else {
        return {
          matched: false,
          expected: expectedCategory,
          found: `${productDescription} (classified as: ${classification.category})`,
          similarity: classification.confidence,
          error: `Product type mismatch: Expected ${expectedCategory}, found ${classification.category}`,
        };
      }
    }
  }

  // Fallback: classify the entire OCR text (less accurate but better than nothing)
  const fallbackClassification = classifyProductType(ocrText);
  if (fallbackClassification.category && fallbackClassification.confidence >= 60) {
    if (categoriesMatch(expectedCategory, fallbackClassification.category)) {
      return {
        matched: true,
        expected: expectedCategory,
        found: `Classified as ${fallbackClassification.category} (confidence: ${fallbackClassification.confidence}%)`,
        similarity: fallbackClassification.confidence,
      };
    } else {
      return {
        matched: false,
        expected: expectedCategory,
        found: `Classified as ${fallbackClassification.category}`,
        similarity: fallbackClassification.confidence,
        error: `Product type mismatch: Expected ${expectedCategory}, found ${fallbackClassification.category}`,
      };
    }
  }

  return {
    matched: false,
    expected: expectedCategory,
    found: match?.match || null,
    similarity: match?.score,
    error: `Could not determine product type from label. Expected ${expectedCategory}.`,
  };
}

/**
 * Verify alcohol content percentage against OCR text
 * Allows for small tolerance (±0.5%)
 */
export function verifyAlcoholContent(
  formValue: number,
  ocrText: string
): FieldResult {
  const foundPercentages = findAlcoholContent(ocrText);

  // Check if any found percentage is within tolerance
  const tolerance = 0.5;
  const matchingPercentage = foundPercentages.find(
    (p) => Math.abs(p - formValue) <= tolerance
  );

  if (matchingPercentage !== undefined) {
    return {
      matched: true,
      expected: `${formValue}%`,
      found: `${matchingPercentage}%`,
      similarity: 100,
    };
  }

  return {
    matched: false,
    expected: `${formValue}%`,
    found: foundPercentages.length > 0 ? `${foundPercentages[0]}%` : null,
    error: foundPercentages.length > 0
      ? `Alcohol content mismatch: Found ${foundPercentages[0]}% on label, expected ${formValue}%`
      : `Alcohol content ${formValue}% not found on label`,
  };
}

/**
 * Verify net contents/volume against OCR text
 * Uses fuzzy matching on normalized volume strings
 */
export function verifyNetContents(
  formValue: string,
  ocrText: string
): FieldResult {
  const foundVolumes = findNetContents(ocrText);

  // Normalize form value and found volumes for comparison
  const normalizedFormValue = normalizeVolumeUnit(formValue);

  for (const volume of foundVolumes) {
    const normalizedVolume = normalizeVolumeUnit(volume);
    const similarity = fuzzyMatch(normalizedFormValue, normalizedVolume);

    if (similarity >= FUZZY_MATCH_THRESHOLD) {
      return {
        matched: true,
        expected: formValue,
        found: volume,
        similarity,
      };
    }
  }

  return {
    matched: false,
    expected: formValue,
    found: foundVolumes.length > 0 ? foundVolumes[0] : null,
    similarity: foundVolumes.length > 0
      ? fuzzyMatch(normalizedFormValue, normalizeVolumeUnit(foundVolumes[0]))
      : undefined,
    error: foundVolumes.length > 0
      ? `Net contents mismatch: Found "${foundVolumes[0]}" on label, expected "${formValue}"`
      : `Net contents "${formValue}" not found on label`,
  };
}

/**
 * Verify government warning presence
 */
export function verifyGovernmentWarning(ocrText: string): FieldResult {
  const hasWarning = findGovernmentWarning(ocrText);

  if (hasWarning) {
    return {
      matched: true,
      expected: 'GOVERNMENT WARNING present',
      found: 'GOVERNMENT WARNING found',
      similarity: 100,
    };
  }

  return {
    matched: false,
    expected: 'GOVERNMENT WARNING present',
    found: null,
    error: 'Government warning statement is missing from the label',
  };
}

/**
 * Main verification function
 * Verifies all fields and returns complete results
 */
export function verifyLabel(
  formData: FormData,
  ocrText: string
): VerificationResult {
  const fields = {
    brandName: verifyBrandName(formData.brandName, ocrText),
    productType: verifyProductType(formData.productType, ocrText),
    alcoholContent: verifyAlcoholContent(formData.alcoholContent, ocrText),
    netContents: verifyNetContents(formData.netContents, ocrText),
    governmentWarning: verifyGovernmentWarning(ocrText),
  };

  // Check if the label is missing too much critical information
  // Critical fields: brandName, productType, alcoholContent
  const criticalFieldsMissing = [
    fields.brandName.found === null,
    fields.productType.found === null,
    fields.alcoholContent.found === null,
  ].filter(Boolean).length;

  // If 2 or more critical fields are missing, the image likely doesn't contain label information
  if (criticalFieldsMissing >= 2) {
    throw new Error('The uploaded image does not appear to contain the required label information. Please upload a clear photo of the complete alcohol label (front and back if applicable).');
  }

  // Overall success if all REQUIRED fields matched
  // Note: Government warning is optional/informational per assignment requirements (bonus feature)
  const success =
    fields.brandName.matched &&
    fields.productType.matched &&
    fields.alcoholContent.matched &&
    fields.netContents.matched;
  // governmentWarning is checked but does not affect success

  return {
    success,
    fields,
  };
}
