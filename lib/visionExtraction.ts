import Anthropic from '@anthropic-ai/sdk';
import { FormData, VerificationResult, FieldResult } from '@/types';

/**
 * Extract label information using Claude Vision API
 * Supports multiple images (e.g., front and back labels)
 * Returns structured data with all required fields
 */
export async function extractLabelDataWithVision(
  images: Array<{ buffer: Buffer; mimeType: string }>
): Promise<{
  brandName: string | null;
  productType: string | null;
  alcoholContent: number | null;
  netContents: string | null;
  hasGovernmentWarning: boolean;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const client = new Anthropic({ apiKey });

  // Build content array with all images
  const content: Anthropic.MessageParam['content'] = [];

  // Add all images to the content array
  images.forEach(({ buffer, mimeType }) => {
    // Convert mime type to Anthropic format (image/jpeg -> image/jpeg, image/png -> image/png, etc.)
    const mediaType = mimeType === 'image/jpg' ? 'image/jpeg' : mimeType;

    (content as Array<any>).push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaType,
        data: buffer.toString('base64'),
      },
    });
  });

  // Add the text prompt
  (content as Array<any>).push({
    type: 'text',
    text: `Analyze these alcohol beverage label images (there may be multiple images showing front and back of the label). Extract the following information by looking at ALL images provided. Return your response as a JSON object with these exact fields:

{
  "brandName": "the brand name on the label",
  "productType": "the product class/type (e.g., 'Red Wine', 'Kentucky Straight Bourbon Whiskey')",
  "alcoholContent": the alcohol percentage as a number (e.g., 13 for 13%),
  "netContents": "the volume/net contents (e.g., '750 ML', '12 fl oz')",
  "hasGovernmentWarning": true or false (whether a government warning is present)
}

If any field cannot be found across ANY of the label images, use null for that field (except hasGovernmentWarning which should be false).
Return ONLY the JSON object, no additional text.`,
  });

  const message = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: content,
      },
    ],
  });

  // Parse Claude's response
  const responseText = message.content[0].type === 'text'
    ? message.content[0].text
    : '';

  try {
    // Extract JSON from response (in case Claude adds any extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    return {
      brandName: extractedData.brandName || null,
      productType: extractedData.productType || null,
      alcoholContent: extractedData.alcoholContent ? Number(extractedData.alcoholContent) : null,
      netContents: extractedData.netContents || null,
      hasGovernmentWarning: Boolean(extractedData.hasGovernmentWarning),
    };
  } catch (error) {
    console.error('Failed to parse Claude vision response:', error);
    console.error('Response text:', responseText);
    throw new Error('Failed to parse vision API response');
  }
}

/**
 * Verify label using Claude Vision API
 * Supports multiple images (e.g., front and back labels)
 * Compares form data against extracted label data
 */
export async function verifyLabelWithVision(
  formData: FormData,
  images: Array<{ buffer: Buffer; mimeType: string }>
): Promise<VerificationResult> {
  // Extract data from all label images using vision
  const extractedData = await extractLabelDataWithVision(images);

  // Verify each field
  const fields = {
    brandName: verifyBrandName(
      formData.brandName,
      extractedData.brandName
    ),
    productType: verifyField(
      'Product type',
      formData.productType,
      extractedData.productType
    ),
    alcoholContent: verifyAlcoholField(
      formData.alcoholContent,
      extractedData.alcoholContent
    ),
    netContents: verifyNetContentsField(
      formData.netContents,
      extractedData.netContents
    ),
    governmentWarning: verifyWarningField(extractedData.hasGovernmentWarning),
  };

  // Overall success if ALL fields matched
  const success = Object.values(fields).every((field) => field.matched);

  return { success, fields };
}

/**
 * Verify brand name with strict exact matching
 * Brand names must match exactly (after normalization)
 */
function verifyBrandName(
  expected: string,
  found: string | null
): FieldResult {
  if (!found) {
    return {
      matched: false,
      expected,
      found: null,
      error: 'Brand name not found on label',
    };
  }

  // Normalize: case-insensitive, trim whitespace, collapse multiple spaces
  const normalizedExpected = expected.toLowerCase().trim().replace(/\s+/g, ' ');
  const normalizedFound = found.toLowerCase().trim().replace(/\s+/g, ' ');

  // Brand name must match exactly after normalization
  if (normalizedExpected === normalizedFound) {
    return {
      matched: true,
      expected,
      found,
      similarity: 100,
    };
  }

  return {
    matched: false,
    expected,
    found,
    error: `Brand name mismatch: Expected "${expected}", found "${found}"`,
  };
}

/**
 * Verify a text field with word-boundary matching (for Product Type)
 * Checks if all words from expected appear in found
 * More accurate than substring matching - prevents false positives
 */
function verifyField(
  fieldName: string,
  expected: string,
  found: string | null
): FieldResult {
  if (!found) {
    return {
      matched: false,
      expected,
      found: null,
      error: `${fieldName} not found on label`,
    };
  }

  // Normalize: lowercase, trim, collapse spaces
  const normalizedExpected = expected.toLowerCase().trim().replace(/\s+/g, ' ');
  const normalizedFound = found.toLowerCase().trim().replace(/\s+/g, ' ');

  // Check for exact match
  if (normalizedExpected === normalizedFound) {
    return {
      matched: true,
      expected,
      found,
      similarity: 100,
    };
  }

  // Word-boundary matching: check if all words from expected appear in found
  // Split by whitespace and punctuation, filter out empty strings
  const expectedWords = normalizedExpected.split(/[\s\-\/]+/).filter(w => w.length > 0);
  const foundWords = normalizedFound.split(/[\s\-\/]+/).filter(w => w.length > 0);

  // Check if all expected words are present in found words
  const allWordsPresent = expectedWords.every(expectedWord =>
    foundWords.some(foundWord =>
      foundWord === expectedWord ||
      foundWord.includes(expectedWord) && expectedWord.length > 2
    )
  );

  if (allWordsPresent) {
    return {
      matched: true,
      expected,
      found,
      similarity: 95,
    };
  }

  // Check reverse: if found is simpler/shorter, check if it's contained in expected
  const allFoundWordsInExpected = foundWords.every(foundWord =>
    expectedWords.some(expectedWord =>
      expectedWord === foundWord ||
      expectedWord.includes(foundWord) && foundWord.length > 2
    )
  );

  if (allFoundWordsInExpected && foundWords.length > 0) {
    return {
      matched: true,
      expected,
      found,
      similarity: 90,
    };
  }

  return {
    matched: false,
    expected,
    found,
    error: `${fieldName} mismatch: Expected "${expected}", found "${found}"`,
  };
}

/**
 * Verify alcohol content with tolerance
 */
function verifyAlcoholField(
  expected: number,
  found: number | null
): FieldResult {
  if (found === null) {
    return {
      matched: false,
      expected: `${expected}%`,
      found: null,
      error: `Alcohol content ${expected}% not found on label`,
    };
  }

  const tolerance = 0.5;
  const difference = Math.abs(expected - found);

  if (difference <= tolerance) {
    return {
      matched: true,
      expected: `${expected}%`,
      found: `${found}%`,
      similarity: 100,
    };
  }

  return {
    matched: false,
    expected: `${expected}%`,
    found: `${found}%`,
    error: `Alcohol content mismatch: Expected ${expected}%, found ${found}%`,
  };
}

/**
 * Verify net contents field with space-insensitive matching
 * Handles cases like "750ML" vs "750 ML" by normalizing spaces between numbers and units
 */
function verifyNetContentsField(
  expected: string,
  found: string | null
): FieldResult {
  if (!found) {
    return {
      matched: false,
      expected,
      found: null,
      error: 'Net contents not found on label',
    };
  }

  // Normalize both strings: lowercase, collapse spaces, remove spaces between numbers and units
  const normalizeVolume = (str: string): string => {
    return str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')  // Collapse multiple spaces
      .replace(/(\d+)\s*(ml|l|oz|gal)/gi, '$1$2')  // Remove space between number and unit
      .replace(/milliliters?/gi, 'ml')
      .replace(/liters?|litres?/gi, 'l')
      .replace(/fl\.?\s*oz/gi, 'floz')
      .replace(/ounces?/gi, 'oz')
      .replace(/\s+/g, '');  // Remove all remaining spaces
  };

  const normalizedExpected = normalizeVolume(expected);
  const normalizedFound = normalizeVolume(found);

  // Check for exact match after normalization
  if (normalizedExpected === normalizedFound) {
    return {
      matched: true,
      expected,
      found,
      similarity: 100,
    };
  }

  // Check if they're similar enough (handles minor variations)
  const similarity = (1 - (levenshteinDistance(normalizedExpected, normalizedFound) / Math.max(normalizedExpected.length, normalizedFound.length))) * 100;

  if (similarity >= 80) {
    return {
      matched: true,
      expected,
      found,
      similarity: Math.round(similarity),
    };
  }

  return {
    matched: false,
    expected,
    found,
    error: `Net contents mismatch: Expected "${expected}", found "${found}"`,
  };
}

/**
 * Simple Levenshtein distance implementation
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Verify government warning presence
 */
function verifyWarningField(hasWarning: boolean): FieldResult {
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
