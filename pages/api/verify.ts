import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File } from 'formidable';
import fs from 'fs';
import { verifyLabelWithVision } from '@/lib/visionExtraction';
// OCR imports disabled - keeping OCR code for future use
// import { extractTextFromImage, extractTextFromMultipleImages } from '@/lib/ocr';
// import { verifyLabel } from '@/lib/verification';
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
      maxFileSize: 1 * 1024 * 1024, // 1MB max file size
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

    // Get uploaded image files (supports multiple images)
    const imageFiles = files.images;

    if (!imageFiles) {
      return res.status(400).json({
        success: false,
        fields: {} as any,
        error: 'No image files uploaded',
      });
    }

    // Convert to array (formidable returns single file or array)
    const imageArray: File[] = Array.isArray(imageFiles) ? imageFiles : [imageFiles];

    // Validate image count (1-2 images)
    if (imageArray.length === 0) {
      return res.status(400).json({
        success: false,
        fields: {} as any,
        error: 'At least one image is required',
      });
    }

    if (imageArray.length > 2) {
      return res.status(400).json({
        success: false,
        fields: {} as any,
        error: 'Maximum 2 images allowed',
      });
    }

    // Validate file types for all images
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    for (const imageFile of imageArray) {
      if (!validTypes.includes(imageFile.mimetype || '')) {
        return res.status(400).json({
          success: false,
          fields: {} as any,
          error: 'Invalid file type. All images must be JPEG, PNG, or WebP.',
        });
      }
    }

    // Read all image files into buffers with their MIME types
    const imageBuffers = imageArray.map(file => fs.readFileSync(file.filepath));
    const imagesWithTypes = imageArray.map((file, index) => ({
      buffer: imageBuffers[index],
      mimeType: file.mimetype || 'image/jpeg',
    }));

    // Use Claude Vision API for verification (OCR fallback disabled)
    console.log(`Attempting verification with Claude Vision API (${imageBuffers.length} image${imageBuffers.length > 1 ? 's' : ''})...`);
    const verificationResult = await verifyLabelWithVision(
      {
        brandName,
        productType,
        alcoholContent,
        netContents,
      },
      imagesWithTypes
    );
    console.log('✓ Vision API verification completed successfully');

    // Clean up all uploaded files
    imageArray.forEach(file => fs.unlinkSync(file.filepath));

    // Return results with image count
    console.log(`Verification completed using Vision API (${imageBuffers.length} image${imageBuffers.length > 1 ? 's' : ''})`);
    return res.status(200).json({
      success: verificationResult.success,
      fields: verificationResult.fields,
      method: 'vision',
      imageCount: imageBuffers.length,
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
