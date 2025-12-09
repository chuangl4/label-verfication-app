/**
 * Test script to verify label processing logic
 * Run with: npx tsx test-labels.ts
 */

import fs from 'fs';
import path from 'path';
import { extractTextFromImage } from './lib/ocr';
import { verifyLabel } from './lib/verification';
import { FormData } from './types';

interface TestCase {
  imagePath: string;
  formData: FormData;
  description: string;
}

const testCases: TestCase[] = [
  {
    imagePath: './test-images/wine-label-1.png',
    description: 'Wine Label 1 - Red Table Wine',
    formData: {
      brandName: 'XYZ Winery',
      productType: 'Red Table Wine',
      alcoholContent: 12.5, // Assuming, as it's not clearly visible
      netContents: '750 mL',
    },
  },
  {
    imagePath: './test-images/wine-labeling-brand-label_3.png',
    description: 'Wine Label 2 - ABC Winery American Red Wine',
    formData: {
      brandName: 'ABC Winery',
      productType: 'American Red Wine',
      alcoholContent: 13,
      netContents: '750 mL',
    },
  },
];

async function runTest(testCase: TestCase) {
  console.log('\n' + '='.repeat(80));
  console.log(`TEST: ${testCase.description}`);
  console.log('='.repeat(80));
  console.log('\nForm Data:');
  console.log(JSON.stringify(testCase.formData, null, 2));

  try {
    // Check if file exists
    if (!fs.existsSync(testCase.imagePath)) {
      console.error(`❌ File not found: ${testCase.imagePath}`);
      return;
    }

    // Read image
    const imageBuffer = fs.readFileSync(testCase.imagePath);
    console.log(`\n📸 Image size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);

    // Run OCR
    console.log('\n🔍 Running OCR...');
    const startTime = Date.now();
    const ocrResult = await extractTextFromImage(imageBuffer);
    const ocrTime = Date.now() - startTime;

    console.log(`✅ OCR completed in ${(ocrTime / 1000).toFixed(2)}s`);
    console.log(`📊 Confidence: ${ocrResult.confidence.toFixed(2)}%`);
    console.log('\n📝 Extracted Text:');
    console.log('-'.repeat(80));
    console.log(ocrResult.text);
    console.log('-'.repeat(80));

    // Run verification
    console.log('\n🔬 Running verification...');
    const verificationResult = verifyLabel(testCase.formData, ocrResult.text);

    console.log(`\n${verificationResult.success ? '✅ VERIFICATION PASSED' : '❌ VERIFICATION FAILED'}`);
    console.log('\nField Results:');
    console.log('-'.repeat(80));

    for (const [fieldName, fieldResult] of Object.entries(verificationResult.fields)) {
      const icon = fieldResult.matched ? '✅' : '❌';
      console.log(`\n${icon} ${fieldName}:`);
      console.log(`   Expected: ${fieldResult.expected}`);
      console.log(`   Found: ${fieldResult.found || 'NOT FOUND'}`);
      if (fieldResult.similarity !== undefined) {
        console.log(`   Similarity: ${fieldResult.similarity.toFixed(1)}%`);
      }
      if (fieldResult.error) {
        console.log(`   Error: ${fieldResult.error}`);
      }
    }
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting Label Processing Tests');
  console.log(`📁 Testing ${testCases.length} label(s)\n`);

  for (const testCase of testCases) {
    await runTest(testCase);
  }

  console.log('\n' + '='.repeat(80));
  console.log('🏁 All tests completed!');
  console.log('='.repeat(80) + '\n');
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
