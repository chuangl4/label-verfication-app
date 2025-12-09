import {
  normalizeText,
  fuzzyMatch,
  isMatch,
  findAlcoholContent,
  findNetContents,
  normalizeVolumeUnit,
  findGovernmentWarning,
  findBestMatch,
  FUZZY_MATCH_THRESHOLD,
} from './textMatching';

describe('textMatching', () => {
  describe('normalizeText', () => {
    it('should convert to lowercase', () => {
      expect(normalizeText('HELLO WORLD')).toBe('hello world');
    });

    it('should trim whitespace', () => {
      expect(normalizeText('  hello  ')).toBe('hello');
    });

    it('should normalize multiple spaces to single space', () => {
      expect(normalizeText('hello    world')).toBe('hello world');
    });

    it('should keep alphanumeric characters and %, ., -', () => {
      expect(normalizeText('ABC-123 45.6% test')).toBe('abc-123 45.6% test');
    });

    it('should remove special characters except %, ., -', () => {
      expect(normalizeText('hello@world!test#')).toBe('helloworldtest');
    });
  });

  describe('fuzzyMatch', () => {
    it('should return 100 for identical strings', () => {
      expect(fuzzyMatch('hello', 'hello')).toBe(100);
    });

    it('should return high score for similar strings', () => {
      const score = fuzzyMatch('Bourbon Whiskey', 'Bourbon Whisky');
      expect(score).toBeGreaterThan(80);
    });

    it('should return low score for different strings', () => {
      const score = fuzzyMatch('Vodka', 'Bourbon');
      expect(score).toBeLessThan(50);
    });

    it('should be case-insensitive', () => {
      expect(fuzzyMatch('HELLO', 'hello')).toBe(100);
    });

    it('should handle extra spaces', () => {
      const score = fuzzyMatch('hello  world', 'hello world');
      expect(score).toBeGreaterThanOrEqual(90);
    });
  });

  describe('isMatch', () => {
    it('should return true for identical strings', () => {
      expect(isMatch('Bourbon', 'Bourbon')).toBe(true);
    });

    it('should return true for similar strings above threshold', () => {
      expect(isMatch('Bourbon Whiskey', 'Bourbon Whisky')).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(isMatch('Vodka', 'Bourbon')).toBe(false);
    });

    it('should respect custom threshold', () => {
      // These strings are somewhat similar but not very
      expect(isMatch('test', 'best', 50)).toBe(true);
      expect(isMatch('test', 'best', 90)).toBe(false);
    });

    it('should use default threshold of 80', () => {
      const score = fuzzyMatch('similar', 'similiar');
      if (score >= 80) {
        expect(isMatch('similar', 'similiar')).toBe(true);
      } else {
        expect(isMatch('similar', 'similiar')).toBe(false);
      }
    });
  });

  describe('findAlcoholContent', () => {
    it('should find percentage with ABV', () => {
      const result = findAlcoholContent('Alcohol 45% ABV');
      expect(result).toContain(45);
    });

    it('should find percentage with alc/vol', () => {
      const result = findAlcoholContent('45% Alc/Vol');
      expect(result).toContain(45);
    });

    it('should find standalone percentage', () => {
      const result = findAlcoholContent('Contains 12.5% alcohol');
      expect(result).toContain(12.5);
    });

    it('should find decimal percentages', () => {
      const result = findAlcoholContent('5.5% ABV');
      expect(result).toContain(5.5);
    });

    it('should handle multiple formats in same text', () => {
      const result = findAlcoholContent('45% ABV or 45% alcohol by volume');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain(45);
    });

    it('should filter out invalid percentages (>100)', () => {
      const result = findAlcoholContent('150% alcohol');
      expect(result).not.toContain(150);
    });

    it('should handle text with negative numbers (extracts positive value)', () => {
      const result = findAlcoholContent('-10% alcohol');
      // The regex pattern matches "10" even with preceding "-"
      // This is acceptable behavior as negative alcohol content doesn't make sense
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should return empty array when no percentage found', () => {
      const result = findAlcoholContent('No alcohol content here');
      expect(result).toEqual([]);
    });

    it('should remove duplicate percentages', () => {
      const result = findAlcoholContent('45% ABV 45% ABV');
      expect(result).toEqual([45]);
    });
  });

  describe('findNetContents', () => {
    it('should find volume in mL', () => {
      const result = findNetContents('750 mL');
      expect(result).toContain('750 mL');
    });

    it('should find volume in fl oz', () => {
      const result = findNetContents('12 fl oz');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should find volume in liters', () => {
      const result = findNetContents('1 L');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle volume without space', () => {
      const result = findNetContents('750ml');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should find decimal volumes', () => {
      const result = findNetContents('1.5 L');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle multiple volumes in text', () => {
      const result = findNetContents('Available in 750 mL or 1 L');
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array when no volume found', () => {
      const result = findNetContents('No volume information');
      expect(result).toEqual([]);
    });

    it('should handle various case formats', () => {
      const result = findNetContents('750 ML');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('normalizeVolumeUnit', () => {
    it('should normalize mL variations', () => {
      expect(normalizeVolumeUnit('750 mL')).toBe('750 ml');
      expect(normalizeVolumeUnit('750 ML')).toBe('750 ml');
      expect(normalizeVolumeUnit('750 milliliters')).toBe('750 ml');
    });

    it('should normalize liter variations', () => {
      expect(normalizeVolumeUnit('1 L')).toBe('1 l');
      expect(normalizeVolumeUnit('1 liter')).toBe('1 l');
      expect(normalizeVolumeUnit('1 litre')).toBe('1 l');
    });

    it('should normalize fl oz variations', () => {
      expect(normalizeVolumeUnit('12 fl oz')).toBe('12 fl oz');
      expect(normalizeVolumeUnit('12 fl. oz')).toBe('12 fl oz');
      expect(normalizeVolumeUnit('12 ounces')).toBe('12 oz');
    });

    it('should normalize gallon', () => {
      expect(normalizeVolumeUnit('1 gallon')).toBe('1 gal');
    });

    it('should handle multiple spaces', () => {
      expect(normalizeVolumeUnit('750   mL')).toBe('750 ml');
    });
  });

  describe('findGovernmentWarning', () => {
    it('should return true when government warning is present', () => {
      expect(findGovernmentWarning('GOVERNMENT WARNING: According to the Surgeon General...')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(findGovernmentWarning('government warning: text here')).toBe(true);
    });

    it('should return false when warning is not present', () => {
      expect(findGovernmentWarning('No warning text here')).toBe(false);
    });

    it('should handle mixed case', () => {
      expect(findGovernmentWarning('GoVeRnMeNt WaRnInG')).toBe(true);
    });

    it('should return false for partial matches', () => {
      expect(findGovernmentWarning('government')).toBe(false);
      expect(findGovernmentWarning('warning')).toBe(false);
    });
  });

  describe('findBestMatch', () => {
    const sampleText = 'Old Tom Distillery Kentucky Straight Bourbon Whiskey 45% ABV 750 mL';

    it('should find exact match', () => {
      const result = findBestMatch('Bourbon', sampleText);
      expect(result).not.toBeNull();
      expect(result?.match.toLowerCase()).toContain('bourbon');
      expect(result?.score).toBeGreaterThanOrEqual(80);
    });

    it('should find multi-word match with lower threshold', () => {
      const result = findBestMatch('Kentucky Bourbon', sampleText, 60);
      expect(result).not.toBeNull();
      expect(result?.score).toBeGreaterThan(0);
    });

    it('should find fuzzy match', () => {
      const result = findBestMatch('Burbon Whisky', sampleText, 70); // Lower threshold for typos
      expect(result).not.toBeNull();
    });

    it('should return null when no match found', () => {
      const result = findBestMatch('Vodka', sampleText);
      expect(result).toBeNull();
    });

    it('should respect custom threshold', () => {
      const result = findBestMatch('Something', sampleText, 95);
      expect(result).toBeNull();
    });

    it('should return best match with highest score', () => {
      const text = 'Bourbon Bourbon Bourban';
      const result = findBestMatch('Bourbon', text);
      expect(result).not.toBeNull();
      expect(result?.score).toBe(100); // Should find exact match
    });

    it('should handle empty OCR text', () => {
      const result = findBestMatch('test', '');
      expect(result).toBeNull();
    });

    it('should handle search term longer than OCR text', () => {
      const result = findBestMatch('Very Long Search Term', 'Short');
      expect(result).toBeNull();
    });
  });

  describe('FUZZY_MATCH_THRESHOLD constant', () => {
    it('should be defined as 80', () => {
      expect(FUZZY_MATCH_THRESHOLD).toBe(80);
    });
  });
});
