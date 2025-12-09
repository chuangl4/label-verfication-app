import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File } from 'formidable';
import fs from 'fs';
import { verifyLabelWithVision } from '@/lib/visionExtraction';
import { extractTextFromImage } from '@/lib/ocr';
import { verifyLabel } from '@/lib/verification';
import { VerifyResponse } from '@/types';

// Disable body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Parse multipart form data (image + fields)
 */
function parseForm(req: NextApiRequest): Promise<{
  fields: formidable.Fields;
  files: formidable.Files;
}> {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB max file size
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

/**
 * Get string value from formidable field
 */
function getFieldValue(field: string | string[] | undefined): string {
  if (Array.isArray(field)) {
    return field[0] || '';
  }
  return field || '';
}

/**
 * API route handler for label verification
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      fields: {} as any,
      error: 'Method not allowed',
    });
  }

  try {
    // Parse form data
    const { fields, files } = await parseForm(req);

    // Extract form fields
    const brandName = getFieldValue(fields.brandName);
    const productType = getFieldValue(fields.productType);
    const alcoholContentStr = getFieldValue(fields.alcoholContent);
    const netContents = getFieldValue(fields.netContents);

    // Validate required fields
    if (!brandName || !productType || !alcoholContentStr || !netContents) {
      return res.status(400).json({
        success: false,
        fields: {} as any,
        error: 'Missing required fields',
      });
    }

    const alcoholContent = parseFloat(alcoholContentStr);
    if (isNaN(alcoholContent)) {
      return res.status(400).json({
        success: false,
        fields: {} as any,
        error: 'Invalid alcohol content value',
      });
    }

    // Get uploaded image file
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!imageFile) {
      return res.status(400).json({
        success: false,
        fields: {} as any,
        error: 'No image file uploaded',
      });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(imageFile.mimetype || '')) {
      return res.status(400).json({
        success: false,
        fields: {} as any,
        error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
      });
    }

    // Read image file
    const imageBuffer = fs.readFileSync(imageFile.filepath);

    let verificationResult;
    let usedMethod: 'vision' | 'ocr' = 'vision';

    try {
      // Try Claude Vision API first
      console.log('Attempting verification with Claude Vision API...');
      verificationResult = await verifyLabelWithVision(
        {
          brandName,
          productType,
          alcoholContent,
          netContents,
        },
        imageBuffer
      );
      console.log('✓ Vision API verification completed successfully');
    } catch (visionError) {
      // Fallback to Tesseract OCR if Vision API fails
      console.warn('Vision API failed, falling back to OCR:', visionError instanceof Error ? visionError.message : visionError);
      usedMethod = 'ocr';

      try {
        console.log('Starting OCR-based label verification...');
        const ocrResult = await extractTextFromImage(imageBuffer);
        console.log('OCR completed. Confidence:', ocrResult.confidence);

        if (!ocrResult.text || ocrResult.text.trim().length === 0) {
          throw new Error('Could not read text from the label image');
        }

        verificationResult = verifyLabel(
          {
            brandName,
            productType,
            alcoholContent,
            netContents,
          },
          ocrResult.text
        );
        console.log('✓ OCR verification completed successfully');
      } catch (ocrError) {
        console.error('Both Vision API and OCR failed:', ocrError);
        throw new Error('Failed to process label image. Please try again with a clearer image.');
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(imageFile.filepath);

    // Return results with method used
    console.log(`Verification completed using: ${usedMethod}`);
    return res.status(200).json({
      success: verificationResult.success,
      fields: verificationResult.fields,
      method: usedMethod, // Include which method was used for transparency
    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({
      success: false,
      fields: {} as any,
      error: error instanceof Error ? error.message : 'An error occurred during verification',
    });
  }
}
