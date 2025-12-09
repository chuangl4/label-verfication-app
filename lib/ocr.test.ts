import {
  extractTextFromImage,
  extractTextFromMultipleImages,
  preprocessImage,
} from './ocr';

// Mock Tesseract
jest.mock('tesseract.js', () => ({
  recognize: jest.fn(),
}));

import Tesseract from 'tesseract.js';

describe('ocr', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.log in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('extractTextFromImage', () => {
    it('should extract text from image buffer', async () => {
      const mockBuffer = Buffer.from('fake-image-data');
      const mockResult = {
        data: {
          text: 'Old Tom Distillery Kentucky Bourbon 45% ABV',
          confidence: 92.5,
        },
      };

      (Tesseract.recognize as jest.Mock).mockResolvedValue(mockResult);

      const result = await extractTextFromImage(mockBuffer);

      expect(result.text).toBe('Old Tom Distillery Kentucky Bourbon 45% ABV');
      expect(result.confidence).toBe(92.5);
      expect(Tesseract.recognize).toHaveBeenCalledWith(
        mockBuffer,
        'eng',
        expect.any(Object)
      );
    });

    it('should extract text from base64 string', async () => {
      const mockBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      const mockResult = {
        data: {
          text: 'Sample text',
          confidence: 85,
        },
      };

      (Tesseract.recognize as jest.Mock).mockResolvedValue(mockResult);

      const result = await extractTextFromImage(mockBase64);

      expect(result.text).toBe('Sample text');
      expect(result.confidence).toBe(85);
    });

    it('should handle OCR errors', async () => {
      const mockBuffer = Buffer.from('corrupted-data');

      (Tesseract.recognize as jest.Mock).mockRejectedValue(
        new Error('OCR failed')
      );

      await expect(extractTextFromImage(mockBuffer)).rejects.toThrow(
        'Failed to extract text from image'
      );
    });

    it('should log OCR progress', async () => {
      const mockBuffer = Buffer.from('fake-image-data');
      const mockResult = {
        data: {
          text: 'Test',
          confidence: 90,
        },
      };

      let loggerCallback: ((m: any) => void) | undefined;

      (Tesseract.recognize as jest.Mock).mockImplementation(
        (imageData, lang, options) => {
          loggerCallback = options.logger;
          return Promise.resolve(mockResult);
        }
      );

      await extractTextFromImage(mockBuffer);

      // Verify logger was set up
      expect(loggerCallback).toBeDefined();

      // Simulate progress callback
      if (loggerCallback) {
        loggerCallback({ status: 'recognizing text', progress: 0.5 });
        expect(console.log).toHaveBeenCalledWith('OCR Progress: 50%');
      }
    });

    it('should handle empty text result', async () => {
      const mockBuffer = Buffer.from('blank-image');
      const mockResult = {
        data: {
          text: '',
          confidence: 0,
        },
      };

      (Tesseract.recognize as jest.Mock).mockResolvedValue(mockResult);

      const result = await extractTextFromImage(mockBuffer);

      expect(result.text).toBe('');
      expect(result.confidence).toBe(0);
    });

    it('should handle low confidence results', async () => {
      const mockBuffer = Buffer.from('unclear-image');
      const mockResult = {
        data: {
          text: 'unclear text',
          confidence: 30,
        },
      };

      (Tesseract.recognize as jest.Mock).mockResolvedValue(mockResult);

      const result = await extractTextFromImage(mockBuffer);

      expect(result.text).toBe('unclear text');
      expect(result.confidence).toBe(30);
    });
  });

  describe('extractTextFromMultipleImages', () => {
    it('should extract text from multiple images', async () => {
      const mockBuffers = [
        Buffer.from('image1'),
        Buffer.from('image2'),
      ];

      const mockResults = [
        {
          data: {
            text: 'Text from image 1',
            confidence: 90,
          },
        },
        {
          data: {
            text: 'Text from image 2',
            confidence: 85,
          },
        },
      ];

      (Tesseract.recognize as jest.Mock)
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1]);

      const result = await extractTextFromMultipleImages(mockBuffers);

      expect(result.images).toHaveLength(2);
      expect(result.images[0].text).toBe('Text from image 1');
      expect(result.images[1].text).toBe('Text from image 2');
      expect(result.combinedText).toContain('Text from image 1');
      expect(result.combinedText).toContain('Text from image 2');
      expect(result.combinedText).toContain('IMAGE SEPARATOR');
    });

    it('should calculate average confidence correctly', async () => {
      const mockBuffers = [
        Buffer.from('image1'),
        Buffer.from('image2'),
        Buffer.from('image3'),
      ];

      const mockResults = [
        { data: { text: 'Text 1', confidence: 90 } },
        { data: { text: 'Text 2', confidence: 80 } },
        { data: { text: 'Text 3', confidence: 70 } },
      ];

      (Tesseract.recognize as jest.Mock)
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1])
        .mockResolvedValueOnce(mockResults[2]);

      const result = await extractTextFromMultipleImages(mockBuffers);

      // Average: (90 + 80 + 70) / 3 = 80
      expect(result.averageConfidence).toBe(80);
    });

    it('should handle failed image processing', async () => {
      const mockBuffers = [
        Buffer.from('image1'),
        Buffer.from('corrupted'),
        Buffer.from('image3'),
      ];

      (Tesseract.recognize as jest.Mock)
        .mockResolvedValueOnce({ data: { text: 'Text 1', confidence: 90 } })
        .mockRejectedValueOnce(new Error('OCR failed'))
        .mockResolvedValueOnce({ data: { text: 'Text 3', confidence: 80 } });

      const result = await extractTextFromMultipleImages(mockBuffers);

      expect(result.images).toHaveLength(3);
      expect(result.images[0].text).toBe('Text 1');
      expect(result.images[1].text).toBe(''); // Failed image
      expect(result.images[1].confidence).toBe(0); // Failed image
      expect(result.images[2].text).toBe('Text 3');

      // Combined text should only include successful images
      expect(result.combinedText).toContain('Text 1');
      expect(result.combinedText).toContain('Text 3');
      // Verify no extra empty sections were added (check separator count)
      const separatorCount = (result.combinedText.match(/IMAGE SEPARATOR/g) || []).length;
      expect(separatorCount).toBe(1); // Only one separator between the two successful texts

      // Average confidence should exclude failed image
      // (90 + 80) / 2 = 85
      expect(result.averageConfidence).toBe(85);
    });

    it('should handle all images failing', async () => {
      const mockBuffers = [
        Buffer.from('bad1'),
        Buffer.from('bad2'),
      ];

      (Tesseract.recognize as jest.Mock)
        .mockRejectedValueOnce(new Error('OCR failed'))
        .mockRejectedValueOnce(new Error('OCR failed'));

      const result = await extractTextFromMultipleImages(mockBuffers);

      expect(result.images).toHaveLength(2);
      expect(result.images[0].confidence).toBe(0);
      expect(result.images[1].confidence).toBe(0);
      expect(result.combinedText).toBe('');
      expect(result.averageConfidence).toBe(0);
    });

    it('should preserve image indices', async () => {
      const mockBuffers = [
        Buffer.from('image1'),
        Buffer.from('image2'),
        Buffer.from('image3'),
      ];

      (Tesseract.recognize as jest.Mock).mockResolvedValue({
        data: { text: 'Text', confidence: 90 },
      });

      const result = await extractTextFromMultipleImages(mockBuffers);

      expect(result.images[0].imageIndex).toBe(0);
      expect(result.images[1].imageIndex).toBe(1);
      expect(result.images[2].imageIndex).toBe(2);
    });

    it('should handle empty buffer array', async () => {
      const mockBuffers: Buffer[] = [];

      const result = await extractTextFromMultipleImages(mockBuffers);

      expect(result.images).toHaveLength(0);
      expect(result.combinedText).toBe('');
      expect(result.averageConfidence).toBe(0);
    });

    it('should filter out images with empty text when combining', async () => {
      const mockBuffers = [
        Buffer.from('image1'),
        Buffer.from('image2'),
        Buffer.from('image3'),
      ];

      (Tesseract.recognize as jest.Mock)
        .mockResolvedValueOnce({ data: { text: 'Text 1', confidence: 90 } })
        .mockResolvedValueOnce({ data: { text: '   ', confidence: 85 } }) // Whitespace only
        .mockResolvedValueOnce({ data: { text: 'Text 3', confidence: 80 } });

      const result = await extractTextFromMultipleImages(mockBuffers);

      // Combined text should not include the whitespace-only result
      expect(result.combinedText).toContain('Text 1');
      expect(result.combinedText).not.toContain('   ');
      expect(result.combinedText).toContain('Text 3');
    });

    it('should log progress for each image', async () => {
      const mockBuffers = [
        Buffer.from('image1'),
        Buffer.from('image2'),
      ];

      (Tesseract.recognize as jest.Mock).mockResolvedValue({
        data: { text: 'Text', confidence: 90 },
      });

      await extractTextFromMultipleImages(mockBuffers);

      expect(console.log).toHaveBeenCalledWith('Processing image 1 of 2...');
      expect(console.log).toHaveBeenCalledWith('Processing image 2 of 2...');
    });
  });

  describe('preprocessImage', () => {
    it('should return the same buffer (placeholder implementation)', () => {
      const mockBuffer = Buffer.from('test-data');

      const result = preprocessImage(mockBuffer);

      expect(result).toBe(mockBuffer);
    });

    it('should handle empty buffer', () => {
      const emptyBuffer = Buffer.from('');

      const result = preprocessImage(emptyBuffer);

      expect(result).toBe(emptyBuffer);
    });
  });
});
