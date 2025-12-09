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
 * Verify product type/class against OCR text
 */
export function verifyProductType(
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
      ? `Product type mismatch: Found "${match.match}" (${match.score}% similarity, threshold ${FUZZY_MATCH_THRESHOLD}%)`
      : `Product type "${formValue}" not found on label`,
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

  // Overall success if ALL fields matched
  const success = Object.values(fields).every((field) => field.matched);

  return {
    success,
    fields,
  };
}
