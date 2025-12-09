import {
  extractLabelDataWithVision,
  verifyLabelWithVision,
} from './visionExtraction';
import { FormData } from '@/types';
import Anthropic from '@anthropic-ai/sdk';

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk');

// Mock productTypeClassifier
jest.mock('./productTypeClassifier', () => ({
  categoriesMatch: jest.fn((cat1: string, cat2: string) =>
    cat1.toLowerCase() === cat2.toLowerCase()
  ),
}));

describe('visionExtraction', () => {
  const mockBuffer = Buffer.from('fake-image-data');
  const mockImages = [{ buffer: mockBuffer, mimeType: 'image/jpeg' }];

  beforeEach(() => {
    jest.clearAllMocks();
    // Set API key for tests
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });

  describe('extractLabelDataWithVision', () => {
    it('should extract label data successfully', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              brandName: 'Old Tom Distillery',
              productType: 'Kentucky Straight Bourbon Whiskey',
              ttbCategory: 'Distilled Spirits',
              alcoholContent: 45,
              netContents: '750 ML',
              hasGovernmentWarning: true,
            }),
          },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue(mockResponse);
      (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => ({
        messages: { create: mockCreate },
      } as any));

      const result = await extractLabelDataWithVision(mockImages);

      expect(result).toEqual({
        brandName: 'Old Tom Distillery',
        productType: 'Kentucky Straight Bourbon Whiskey',
        ttbCategory: 'Distilled Spirits',
        alcoholContent: 45,
        netContents: '750 ML',
        hasGovernmentWarning: true,
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1024,
        })
      );
    });

    it('should throw error if API key is not set', async () => {
      delete process.env.ANTHROPIC_API_KEY;

      await expect(extractLabelDataWithVision(mockImages)).rejects.toThrow(
        'ANTHROPIC_API_KEY environment variable is not set'
      );
    });

    it('should handle null fields in response', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              brandName: 'Old Tom',
              productType: 'Bourbon',
              ttbCategory: 'Distilled Spirits',
              alcoholContent: null,
              netContents: null,
              hasGovernmentWarning: false,
            }),
          },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue(mockResponse);
      (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => ({
        messages: { create: mockCreate },
      } as any));

      const result = await extractLabelDataWithVision(mockImages);

      expect(result.alcoholContent).toBeNull();
      expect(result.netContents).toBeNull();
      expect(result.hasGovernmentWarning).toBe(false);
    });

    it('should handle multiple images', async () => {
      const multipleImages = [
        { buffer: Buffer.from('image1'), mimeType: 'image/jpeg' },
        { buffer: Buffer.from('image2'), mimeType: 'image/png' },
      ];

      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              brandName: 'Test Brand',
              productType: 'Wine',
              ttbCategory: 'Wine',
              alcoholContent: 13,
              netContents: '750 ML',
              hasGovernmentWarning: true,
            }),
          },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue(mockResponse);
      (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => ({
        messages: { create: mockCreate },
      } as any));

      const result = await extractLabelDataWithVision(multipleImages);

      expect(result.brandName).toBe('Test Brand');

      // Verify that multiple images were sent
      const callArgs = mockCreate.mock.calls[0][0];
      const content = callArgs.messages[0].content;

      // Should have 2 images + 1 text prompt = 3 items
      expect(content).toHaveLength(3);
    });

    it('should convert image/jpg to image/jpeg', async () => {
      const jpgImages = [{ buffer: mockBuffer, mimeType: 'image/jpg' }];

      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              brandName: 'Test',
              productType: 'Wine',
              ttbCategory: 'Wine',
              alcoholContent: 13,
              netContents: '750 ML',
              hasGovernmentWarning: false,
            }),
          },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue(mockResponse);
      (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => ({
        messages: { create: mockCreate },
      } as any));

      await extractLabelDataWithVision(jpgImages);

      const callArgs = mockCreate.mock.calls[0][0];
      const imageContent = callArgs.messages[0].content[0];

      expect(imageContent.source.media_type).toBe('image/jpeg');
    });

    it('should throw error when all critical fields are null', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              brandName: null,
              productType: null,
              ttbCategory: null,
              alcoholContent: null,
              netContents: null,
              hasGovernmentWarning: false,
            }),
          },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue(mockResponse);
      (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => ({
        messages: { create: mockCreate },
      } as any));

      await expect(extractLabelDataWithVision(mockImages)).rejects.toThrow(
        /Could not read text from the label image|does not appear to contain the required label information/
      );
    });

    it('should throw error when response has no JSON', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: 'No JSON here, just plain text',
          },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue(mockResponse);
      (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => ({
        messages: { create: mockCreate },
      } as any));

      await expect(extractLabelDataWithVision(mockImages)).rejects.toThrow(
        'does not appear to contain the required label information'
      );
    });

    it('should handle malformed JSON in response', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: '{ invalid json }',
          },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue(mockResponse);
      (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => ({
        messages: { create: mockCreate },
      } as any));

      await expect(extractLabelDataWithVision(mockImages)).rejects.toThrow(
        'does not appear to contain the required label information'
      );
    });
  });

  describe('verifyLabelWithVision', () => {
    const mockFormData: FormData = {
      brandName: 'Old Tom Distillery',
      productType: 'Distilled Spirits',
      alcoholContent: 45,
      netContents: '750 ml',
    };

    it('should return success when all fields match', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              brandName: 'Old Tom Distillery',
              productType: 'Kentucky Straight Bourbon Whiskey',
              ttbCategory: 'Distilled Spirits',
              alcoholContent: 45,
              netContents: '750 ML',
              hasGovernmentWarning: true,
            }),
          },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue(mockResponse);
      (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => ({
        messages: { create: mockCreate },
      } as any));

      const result = await verifyLabelWithVision(mockFormData, mockImages);

      expect(result.success).toBe(true);
      expect(result.fields.brandName.matched).toBe(true);
      expect(result.fields.productType.matched).toBe(true);
      expect(result.fields.alcoholContent.matched).toBe(true);
      expect(result.fields.netContents.matched).toBe(true);
    });

    it('should return failure when brand name does not match', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              brandName: 'Different Brand',
              productType: 'Bourbon',
              ttbCategory: 'Distilled Spirits',
              alcoholContent: 45,
              netContents: '750 ML',
              hasGovernmentWarning: false,
            }),
          },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue(mockResponse);
      (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => ({
        messages: { create: mockCreate },
      } as any));

      const result = await verifyLabelWithVision(mockFormData, mockImages);

      expect(result.success).toBe(false);
      expect(result.fields.brandName.matched).toBe(false);
      expect(result.fields.brandName.error).toContain('mismatch');
    });

    it('should return failure when TTB category does not match', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              brandName: 'Old Tom Distillery',
              productType: 'Red Wine',
              ttbCategory: 'Wine',
              alcoholContent: 45,
              netContents: '750 ML',
              hasGovernmentWarning: false,
            }),
          },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue(mockResponse);
      (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => ({
        messages: { create: mockCreate },
      } as any));

      const result = await verifyLabelWithVision(mockFormData, mockImages);

      expect(result.success).toBe(false);
      expect(result.fields.productType.matched).toBe(false);
    });

    it('should handle alcohol content within tolerance', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              brandName: 'Old Tom Distillery',
              productType: 'Bourbon',
              ttbCategory: 'Distilled Spirits',
              alcoholContent: 45.3, // Within 0.5% tolerance
              netContents: '750 ML',
              hasGovernmentWarning: false,
            }),
          },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue(mockResponse);
      (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => ({
        messages: { create: mockCreate },
      } as any));

      const result = await verifyLabelWithVision(mockFormData, mockImages);

      expect(result.fields.alcoholContent.matched).toBe(true);
    });

    it('should handle net contents with different spacing', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              brandName: 'Old Tom Distillery',
              productType: 'Bourbon',
              ttbCategory: 'Distilled Spirits',
              alcoholContent: 45,
              netContents: '750ML', // No space
              hasGovernmentWarning: false,
            }),
          },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue(mockResponse);
      (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => ({
        messages: { create: mockCreate },
      } as any));

      const result = await verifyLabelWithVision(mockFormData, mockImages);

      expect(result.fields.netContents.matched).toBe(true);
    });

    it('should throw error when 2 or more critical fields are missing', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              brandName: null,
              productType: null,
              ttbCategory: null,
              alcoholContent: null,
              netContents: '750 ML',
              hasGovernmentWarning: false,
            }),
          },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue(mockResponse);
      (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => ({
        messages: { create: mockCreate },
      } as any));

      await expect(verifyLabelWithVision(mockFormData, mockImages)).rejects.toThrow(
        /does not appear to contain the required label information|Could not read text from the label image/
      );
    });

    it('should handle government warning field correctly', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              brandName: 'Old Tom Distillery',
              productType: 'Bourbon',
              ttbCategory: 'Distilled Spirits',
              alcoholContent: 45,
              netContents: '750 ML',
              hasGovernmentWarning: true,
            }),
          },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue(mockResponse);
      (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => ({
        messages: { create: mockCreate },
      } as any));

      const result = await verifyLabelWithVision(mockFormData, mockImages);

      expect(result.fields.governmentWarning.matched).toBe(true);
      // Government warning should not affect overall success
      expect(result.success).toBe(true);
    });

    it('should handle case-insensitive brand name matching', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              brandName: 'OLD TOM DISTILLERY', // Different case
              productType: 'Bourbon',
              ttbCategory: 'Distilled Spirits',
              alcoholContent: 45,
              netContents: '750 ML',
              hasGovernmentWarning: false,
            }),
          },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue(mockResponse);
      (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => ({
        messages: { create: mockCreate },
      } as any));

      const result = await verifyLabelWithVision(mockFormData, mockImages);

      expect(result.fields.brandName.matched).toBe(true);
    });
  });
});
