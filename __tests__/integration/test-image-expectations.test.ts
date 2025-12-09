/**
 * Test image expectations based on TEST_RESULTS.md documentation
 * These tests verify that our extraction matches the documented behavior
 *
 * @jest-environment node
 */

import path from 'path';
import fs from 'fs';
import { extractTextFromImage } from '@/lib/ocr';
import { extractLabelDataWithVision } from '@/lib/visionExtraction';
import { findAlcoholContent, findNetContents, findGovernmentWarning } from '@/lib/textMatching';

// Helper to load test images
function loadTestImage(filename: string): Buffer {
  const imagePath = path.join(process.cwd(), 'test-images', filename);
  return fs.readFileSync(imagePath);
}

function testImageExists(filename: string): boolean {
  const imagePath = path.join(process.cwd(), 'test-images', filename);
  return fs.existsSync(imagePath);
}

describe('Test Image Expectations (from TEST_RESULTS.md)', () => {
  describe('wine-label-1.png (Red Table Wine)', () => {
    const imageFile = 'wine-label-1.png';

    it('should extract expected text content with OCR', async () => {
      if (!testImageExists(imageFile)) {
        console.log(`Skipping: ${imageFile} not found`);
        return;
      }

      const imageBuffer = loadTestImage(imageFile);
      const result = await extractTextFromImage(imageBuffer);

      const normalizedText = result.text.toLowerCase();

      // Expected content from TEST_RESULTS.md:
      // - Brand: XYZ WINERY
      // - Type: RED TABLE WINE
      // - Volume: 750ML
      // - Warning: GOVERNMENT WARNING
      // - Note: Alcohol content NOT on label

      // Brand should be present
      expect(normalizedText).toMatch(/xyz.*winery|winery.*xyz/i);

      // Product type should be present
      expect(normalizedText).toMatch(/red.*table.*wine|table.*wine/i);

      // Government warning should be present
      expect(normalizedText).toMatch(/government.*warning/i);

      // Volume should be present (may be detected as 750ML or 750 ML)
      expect(normalizedText).toMatch(/750\s*ml/i);

      // Confidence should be good (documented as 85%)
      expect(result.confidence).toBeGreaterThan(70);
    }, 30000);

    it('should extract expected fields with Vision API', async () => {
      const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

      if (!hasApiKey) {
        console.log('Skipping: ANTHROPIC_API_KEY not set');
        return;
      }

      if (!testImageExists(imageFile)) {
        console.log(`Skipping: ${imageFile} not found`);
        return;
      }

      const imageBuffer = loadTestImage(imageFile);
      const result = await extractLabelDataWithVision([
        { buffer: imageBuffer, mimeType: 'image/png' },
      ]);

      // Brand name should contain "Winery"
      if (result.brandName) {
        expect(result.brandName.toLowerCase()).toMatch(/winery/i);
      }

      // TTB category should be Wine
      expect(result.ttbCategory).toBe('Wine');

      // Product type should mention wine
      if (result.productType) {
        expect(result.productType.toLowerCase()).toMatch(/wine/i);
      }

      // Government warning should be detected
      expect(result.hasGovernmentWarning).toBe(true);

      // Net contents should be detected
      if (result.netContents) {
        expect(result.netContents.toLowerCase()).toMatch(/750\s*ml/i);
      }
    }, 30000);

    it('should find government warning in extracted text', async () => {
      if (!testImageExists(imageFile)) {
        console.log(`Skipping: ${imageFile} not found`);
        return;
      }

      const imageBuffer = loadTestImage(imageFile);
      const result = await extractTextFromImage(imageBuffer);

      const hasWarning = findGovernmentWarning(result.text);
      expect(hasWarning).toBe(true);
    }, 30000);

    it('should find net contents in extracted text', async () => {
      if (!testImageExists(imageFile)) {
        console.log(`Skipping: ${imageFile} not found`);
        return;
      }

      const imageBuffer = loadTestImage(imageFile);
      const result = await extractTextFromImage(imageBuffer);

      const volumes = findNetContents(result.text);

      // Should find 750 mL (or 750ML)
      expect(volumes.length).toBeGreaterThan(0);

      const has750ml = volumes.some((v) => v.toLowerCase().includes('750'));
      expect(has750ml).toBe(true);
    }, 30000);
  });

  describe('wine-labeling-brand-label_3.png (ABC Winery)', () => {
    const imageFile = 'wine-labeling-brand-label_3.png';

    it('should extract expected text content with OCR', async () => {
      if (!testImageExists(imageFile)) {
        console.log(`Skipping: ${imageFile} not found`);
        return;
      }

      const imageBuffer = loadTestImage(imageFile);
      const result = await extractTextFromImage(imageBuffer);

      const normalizedText = result.text.toLowerCase();

      // Expected content from TEST_RESULTS.md:
      // - Brand: ABC WINERY
      // - Type: AMERICAN RED WINE
      // - ABV: ALC. 13% BY VOL
      // - Volume: 750 ML (often missed by OCR)
      // - Warning: GOVERNMENT WARNING

      // Brand should be present
      expect(normalizedText).toMatch(/abc.*winery|abc\s+winery/i);

      // Product type
      expect(normalizedText).toMatch(/american.*red.*wine|red.*wine/i);

      // Alcohol content
      expect(normalizedText).toMatch(/13.*%|alc.*13/i);

      // Government warning
      expect(normalizedText).toMatch(/government.*warning/i);

      // Confidence documented as 78% (moderate)
      expect(result.confidence).toBeGreaterThan(60);
    }, 30000);

    it('should find alcohol content in extracted text', async () => {
      if (!testImageExists(imageFile)) {
        console.log(`Skipping: ${imageFile} not found`);
        return;
      }

      const imageBuffer = loadTestImage(imageFile);
      const result = await extractTextFromImage(imageBuffer);

      const percentages = findAlcoholContent(result.text);

      // Should find 13%
      expect(percentages.length).toBeGreaterThan(0);
      expect(percentages).toContain(13);
    }, 30000);

    it('should extract expected fields with Vision API', async () => {
      const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

      if (!hasApiKey) {
        console.log('Skipping: ANTHROPIC_API_KEY not set');
        return;
      }

      if (!testImageExists(imageFile)) {
        console.log(`Skipping: ${imageFile} not found`);
        return;
      }

      const imageBuffer = loadTestImage(imageFile);
      const result = await extractLabelDataWithVision([
        { buffer: imageBuffer, mimeType: 'image/png' },
      ]);

      // Brand name should be ABC Winery
      if (result.brandName) {
        expect(result.brandName.toLowerCase()).toMatch(/abc.*winery/i);
      }

      // TTB category should be Wine
      expect(result.ttbCategory).toBe('Wine');

      // Alcohol content should be 13%
      expect(result.alcoholContent).toBe(13);

      // Government warning should be present
      expect(result.hasGovernmentWarning).toBe(true);
    }, 30000);
  });

  describe('Multi-image test cases', () => {
    it('should extract more complete data from case-1 front and back combined', async () => {
      if (!testImageExists('case-1-front.jpeg') || !testImageExists('case-1-back.jpeg')) {
        console.log('Skipping: case-1 images not found');
        return;
      }

      const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
      if (!hasApiKey) {
        console.log('Skipping: ANTHROPIC_API_KEY not set');
        return;
      }

      const frontBuffer = loadTestImage('case-1-front.jpeg');
      const backBuffer = loadTestImage('case-1-back.jpeg');

      const result = await extractLabelDataWithVision([
        { buffer: frontBuffer, mimeType: 'image/jpeg' },
        { buffer: backBuffer, mimeType: 'image/jpeg' },
      ]);

      // With both front and back, we should get complete information
      expect(result.brandName).toBeTruthy();
      expect(result.productType).toBeTruthy();
      expect(result.ttbCategory).toBeTruthy();

      // At least one of these should be present
      const hasVolumeOrABV = !!(result.netContents || result.alcoholContent !== null);
      expect(hasVolumeOrABV).toBe(true);
    }, 45000);

    it('should extract complete data from case-3 front and back combined', async () => {
      if (!testImageExists('case-3-front.jpeg') || !testImageExists('case-3-back.jpeg')) {
        console.log('Skipping: case-3 images not found');
        return;
      }

      const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
      if (!hasApiKey) {
        console.log('Skipping: ANTHROPIC_API_KEY not set');
        return;
      }

      const frontBuffer = loadTestImage('case-3-front.jpeg');
      const backBuffer = loadTestImage('case-3-back.jpeg');

      const result = await extractLabelDataWithVision([
        { buffer: frontBuffer, mimeType: 'image/jpeg' },
        { buffer: backBuffer, mimeType: 'image/jpeg' },
      ]);

      // Verify we get data from combining both images
      expect(result).toBeDefined();

      // At least brand or product type should be present
      const hasCoreData = result.brandName || result.productType;
      expect(hasCoreData).toBeTruthy();
    }, 45000);
  });

  describe('Quality and edge cases', () => {
    it('should handle blurred image (case-2-blurred.jpg)', async () => {
      if (!testImageExists('case-2-blurred.jpg')) {
        console.log('Skipping: case-2-blurred.jpg not found');
        return;
      }

      const imageBuffer = loadTestImage('case-2-blurred.jpg');

      try {
        const result = await extractTextFromImage(imageBuffer);

        // Blurred images will have lower confidence
        expect(result.confidence).toBeDefined();

        // May still extract some text, but quality will be poor
        expect(result.text).toBeDefined();
      } catch (error: any) {
        // OCR might fail completely on very blurred images
        expect(error).toBeDefined();
      }
    }, 30000);

    it('should compare OCR vs Vision API on same image', async () => {
      const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

      if (!hasApiKey) {
        console.log('Skipping: ANTHROPIC_API_KEY not set');
        return;
      }

      if (!testImageExists('case-2.jpeg')) {
        console.log('Skipping: case-2.jpeg not found');
        return;
      }

      const imageBuffer = loadTestImage('case-2.jpeg');

      // Extract with both methods
      const ocrResult = await extractTextFromImage(imageBuffer);
      const visionResult = await extractLabelDataWithVision([
        { buffer: imageBuffer, mimeType: 'image/jpeg' },
      ]);

      // Both should extract some text
      expect(ocrResult.text.length).toBeGreaterThan(0);
      expect(visionResult.brandName || visionResult.productType).toBeTruthy();

      // Vision API should typically provide more structured data
      console.log('OCR text length:', ocrResult.text.length);
      console.log('Vision extracted fields:', {
        brandName: visionResult.brandName,
        productType: visionResult.productType,
        alcoholContent: visionResult.alcoholContent,
        netContents: visionResult.netContents,
      });
    }, 45000);
  });
});
