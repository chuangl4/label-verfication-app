import {
  verifyBrandName,
  verifyProductType,
  verifyAlcoholContent,
  verifyNetContents,
  verifyGovernmentWarning,
  verifyLabel,
} from './verification';
import { FormData } from '@/types';

// Mock dependencies
jest.mock('./textMatching', () => ({
  findBestMatch: jest.fn(),
  findAlcoholContent: jest.fn(),
  findNetContents: jest.fn(),
  findGovernmentWarning: jest.fn(),
  normalizeVolumeUnit: jest.fn((text: string) => text.toLowerCase()),
  fuzzyMatch: jest.fn(),
  FUZZY_MATCH_THRESHOLD: 80,
}));

jest.mock('./productTypeClassifier', () => ({
  classifyProductType: jest.fn(),
  categoriesMatch: jest.fn((cat1: string, cat2: string) => cat1.toLowerCase() === cat2.toLowerCase()),
}));

import * as textMatching from './textMatching';
import * as productTypeClassifier from './productTypeClassifier';

describe('verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyBrandName', () => {
    it('should return matched result when brand name is found', () => {
      (textMatching.findBestMatch as jest.Mock).mockReturnValue({
        match: 'Old Tom Distillery',
        score: 95,
      });

      const result = verifyBrandName('Old Tom Distillery', 'Old Tom Distillery Kentucky Bourbon');

      expect(result.matched).toBe(true);
      expect(result.expected).toBe('Old Tom Distillery');
      expect(result.found).toBe('Old Tom Distillery');
      expect(result.similarity).toBe(95);
    });

    it('should return not matched result when brand name is not found', () => {
      (textMatching.findBestMatch as jest.Mock).mockReturnValue(null);

      const result = verifyBrandName('Old Tom Distillery', 'Some other text');

      expect(result.matched).toBe(false);
      expect(result.expected).toBe('Old Tom Distillery');
      expect(result.found).toBeNull();
      expect(result.error).toContain('not found');
    });

    it('should return not matched when score is below threshold', () => {
      (textMatching.findBestMatch as jest.Mock).mockReturnValue({
        match: 'Different Brand',
        score: 50,
      });

      const result = verifyBrandName('Old Tom Distillery', 'Different Brand');

      expect(result.matched).toBe(false);
      expect(result.error).toContain('mismatch');
    });
  });

  describe('verifyProductType', () => {
    it('should match when category is found directly in text', () => {
      (textMatching.findBestMatch as jest.Mock).mockReturnValue({
        match: 'Distilled Spirits',
        score: 85,
      });

      const result = verifyProductType('Distilled Spirits', 'This is a Distilled Spirits product');

      expect(result.matched).toBe(true);
      expect(result.expected).toBe('Distilled Spirits');
    });

    it('should classify product type from description', () => {
      (textMatching.findBestMatch as jest.Mock).mockReturnValue(null);
      (productTypeClassifier.classifyProductType as jest.Mock).mockReturnValue({
        category: 'Distilled Spirits',
        confidence: 85,
      });

      const result = verifyProductType('Distilled Spirits', 'Kentucky Straight Bourbon Whiskey');

      expect(result.matched).toBe(true);
      expect(productTypeClassifier.classifyProductType).toHaveBeenCalled();
    });

    it('should return not matched for wrong product type classification', () => {
      (textMatching.findBestMatch as jest.Mock).mockReturnValue(null);
      (productTypeClassifier.classifyProductType as jest.Mock).mockReturnValue({
        category: 'Wine',
        confidence: 85,
      });
      (productTypeClassifier.categoriesMatch as jest.Mock).mockReturnValue(false);

      const result = verifyProductType('Distilled Spirits', 'Cabernet Sauvignon Wine');

      expect(result.matched).toBe(false);
      expect(result.error).toContain('mismatch');
    });

    it('should handle low confidence classification', () => {
      (textMatching.findBestMatch as jest.Mock).mockReturnValue(null);
      (productTypeClassifier.classifyProductType as jest.Mock).mockReturnValue({
        category: null,
        confidence: 30,
      });

      const result = verifyProductType('Distilled Spirits', 'Unclear text');

      expect(result.matched).toBe(false);
      expect(result.error).toContain('Could not determine');
    });
  });

  describe('verifyAlcoholContent', () => {
    it('should match when exact percentage is found', () => {
      (textMatching.findAlcoholContent as jest.Mock).mockReturnValue([45]);

      const result = verifyAlcoholContent(45, '45% ABV');

      expect(result.matched).toBe(true);
      expect(result.expected).toBe('45%');
      expect(result.found).toBe('45%');
    });

    it('should match within tolerance (±0.5%)', () => {
      (textMatching.findAlcoholContent as jest.Mock).mockReturnValue([45.3]);

      const result = verifyAlcoholContent(45, '45.3% ABV');

      expect(result.matched).toBe(true);
    });

    it('should not match outside tolerance', () => {
      (textMatching.findAlcoholContent as jest.Mock).mockReturnValue([46]);

      const result = verifyAlcoholContent(45, '46% ABV');

      expect(result.matched).toBe(false);
      expect(result.error).toContain('mismatch');
    });

    it('should handle no percentage found', () => {
      (textMatching.findAlcoholContent as jest.Mock).mockReturnValue([]);

      const result = verifyAlcoholContent(45, 'No alcohol content');

      expect(result.matched).toBe(false);
      expect(result.found).toBeNull();
      expect(result.error).toContain('not found');
    });

    it('should handle multiple percentages and find the matching one', () => {
      (textMatching.findAlcoholContent as jest.Mock).mockReturnValue([12, 45, 5]);

      const result = verifyAlcoholContent(45, 'Contains 45% ABV');

      expect(result.matched).toBe(true);
      expect(result.found).toBe('45%');
    });
  });

  describe('verifyNetContents', () => {
    it('should match when volume is found', () => {
      (textMatching.findNetContents as jest.Mock).mockReturnValue(['750 ml']);
      (textMatching.fuzzyMatch as jest.Mock).mockReturnValue(95);

      const result = verifyNetContents('750 ml', '750 ml bottle');

      expect(result.matched).toBe(true);
      expect(result.expected).toBe('750 ml');
      expect(result.found).toBe('750 ml');
    });

    it('should match with normalized volumes', () => {
      (textMatching.findNetContents as jest.Mock).mockReturnValue(['750 mL']);
      (textMatching.fuzzyMatch as jest.Mock).mockReturnValue(100);

      const result = verifyNetContents('750 ml', '750 mL');

      expect(result.matched).toBe(true);
    });

    it('should not match different volumes', () => {
      (textMatching.findNetContents as jest.Mock).mockReturnValue(['1 L']);
      (textMatching.fuzzyMatch as jest.Mock).mockReturnValue(50);

      const result = verifyNetContents('750 ml', '1 L bottle');

      expect(result.matched).toBe(false);
      expect(result.error).toContain('mismatch');
    });

    it('should handle no volume found', () => {
      (textMatching.findNetContents as jest.Mock).mockReturnValue([]);

      const result = verifyNetContents('750 ml', 'No volume');

      expect(result.matched).toBe(false);
      expect(result.found).toBeNull();
      expect(result.error).toContain('not found');
    });

    it('should find best match among multiple volumes', () => {
      (textMatching.findNetContents as jest.Mock).mockReturnValue(['1 L', '750 ml', '500 ml']);
      (textMatching.fuzzyMatch as jest.Mock)
        .mockReturnValueOnce(50)  // 1 L - poor match
        .mockReturnValueOnce(95)  // 750 ml - good match
        .mockReturnValueOnce(60); // 500 ml - okay match

      const result = verifyNetContents('750 ml', 'Available in 1 L, 750 ml, 500 ml');

      expect(result.matched).toBe(true);
      expect(result.found).toBe('750 ml');
    });
  });

  describe('verifyGovernmentWarning', () => {
    it('should match when government warning is present', () => {
      (textMatching.findGovernmentWarning as jest.Mock).mockReturnValue(true);

      const result = verifyGovernmentWarning('GOVERNMENT WARNING: ...');

      expect(result.matched).toBe(true);
      expect(result.expected).toContain('GOVERNMENT WARNING');
      expect(result.found).toContain('GOVERNMENT WARNING');
    });

    it('should not match when government warning is absent', () => {
      (textMatching.findGovernmentWarning as jest.Mock).mockReturnValue(false);

      const result = verifyGovernmentWarning('No warning here');

      expect(result.matched).toBe(false);
      expect(result.found).toBeNull();
      expect(result.error).toContain('missing');
    });
  });

  describe('verifyLabel', () => {
    const mockFormData: FormData = {
      brandName: 'Old Tom Distillery',
      productType: 'Distilled Spirits',
      alcoholContent: 45,
      netContents: '750 ml',
    };

    const mockOcrText = 'Old Tom Distillery Kentucky Bourbon 45% ABV 750 ml GOVERNMENT WARNING';

    beforeEach(() => {
      // Set up default mocks for successful verification
      // Mock findBestMatch to return different results based on the search term
      (textMatching.findBestMatch as jest.Mock).mockImplementation((searchTerm: string) => {
        if (searchTerm === 'Old Tom Distillery') {
          return { match: 'Old Tom Distillery', score: 95 };
        } else if (searchTerm === 'Distilled Spirits') {
          return { match: 'Distilled Spirits', score: 95 };
        }
        return null;
      });
      (textMatching.findAlcoholContent as jest.Mock).mockReturnValue([45]);
      (textMatching.findNetContents as jest.Mock).mockReturnValue(['750 ml']);
      (textMatching.fuzzyMatch as jest.Mock).mockImplementation((str1, str2) => {
        console.log('fuzzyMatch called with:', str1, str2);
        return 95;
      });
      (textMatching.findGovernmentWarning as jest.Mock).mockReturnValue(true);
      (productTypeClassifier.classifyProductType as jest.Mock).mockReturnValue({
        category: 'Distilled Spirits',
        confidence: 85,
      });
      (productTypeClassifier.categoriesMatch as jest.Mock).mockReturnValue(true);
    });

    it('should verify all fields and calculate overall success', () => {
      const result = verifyLabel(mockFormData, mockOcrText);

      // Verify all fields are checked
      expect(result.fields.brandName).toBeDefined();
      expect(result.fields.productType).toBeDefined();
      expect(result.fields.alcoholContent).toBeDefined();
      expect(result.fields.netContents).toBeDefined();
      expect(result.fields.governmentWarning).toBeDefined();

      // Overall success depends on all REQUIRED fields matching
      const requiredFieldsMatch =
        result.fields.brandName.matched &&
        result.fields.productType.matched &&
        result.fields.alcoholContent.matched &&
        result.fields.netContents.matched;

      expect(result.success).toBe(requiredFieldsMatch);
    });

    it('should return failure when brand name does not match', () => {
      (textMatching.findBestMatch as jest.Mock).mockReturnValue(null);

      const result = verifyLabel(mockFormData, mockOcrText);

      expect(result.success).toBe(false);
      expect(result.fields.brandName.matched).toBe(false);
    });

    it('should return failure when alcohol content does not match', () => {
      (textMatching.findAlcoholContent as jest.Mock).mockReturnValue([40]);

      const result = verifyLabel(mockFormData, mockOcrText);

      expect(result.success).toBe(false);
      expect(result.fields.alcoholContent.matched).toBe(false);
    });

    it('should include government warning result regardless of success', () => {
      const result = verifyLabel(mockFormData, mockOcrText);

      expect(result.fields.governmentWarning).toBeDefined();
      expect(result.fields.governmentWarning.matched).toBe(true);
    });

    it('should throw error when 2 or more critical fields are missing', () => {
      // Mock all critical fields as not found
      (textMatching.findBestMatch as jest.Mock).mockReturnValue(null);
      (textMatching.findAlcoholContent as jest.Mock).mockReturnValue([]);
      (productTypeClassifier.classifyProductType as jest.Mock).mockReturnValue({
        category: null,
        confidence: 0,
      });

      expect(() => verifyLabel(mockFormData, 'unreadable text')).toThrow(
        'does not appear to contain the required label information'
      );
    });

    it('should not throw error when only 1 critical field is missing', () => {
      // Only brand name is missing
      (textMatching.findBestMatch as jest.Mock).mockReturnValue(null);

      expect(() => verifyLabel(mockFormData, mockOcrText)).not.toThrow();
    });

    it('should verify all fields', () => {
      const result = verifyLabel(mockFormData, mockOcrText);

      expect(result.fields).toHaveProperty('brandName');
      expect(result.fields).toHaveProperty('productType');
      expect(result.fields).toHaveProperty('alcoholContent');
      expect(result.fields).toHaveProperty('netContents');
      expect(result.fields).toHaveProperty('governmentWarning');
    });

    it('should pass form data to individual verification functions', () => {
      verifyLabel(mockFormData, mockOcrText);

      expect(textMatching.findBestMatch).toHaveBeenCalledWith('Old Tom Distillery', mockOcrText);
      expect(textMatching.findAlcoholContent).toHaveBeenCalledWith(mockOcrText);
      expect(textMatching.findNetContents).toHaveBeenCalledWith(mockOcrText);
      expect(textMatching.findGovernmentWarning).toHaveBeenCalledWith(mockOcrText);
    });
  });
});
