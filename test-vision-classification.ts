/**
 * Test script for Vision API TTB Category Classification
 * Run with: npx tsx test-vision-classification.ts
 */

import dotenv from 'dotenv';
import fs from 'fs';
import { extractLabelDataWithVision } from './lib/visionExtraction';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

interface TestCase {
  imagePaths: string[];
  expectedCategory: 'Wine' | 'Distilled Spirits' | 'Malt Beverage';
  description: string;
}

const testCases: TestCase[] = [
  {
    imagePaths: ['./test-images/wine-label-1.png'],
    expectedCategory: 'Wine',
    description: 'Wine Label 1 - Red Table Wine',
  },
  {
    imagePaths: ['./test-images/wine-labeling-brand-label_3.png'],
    expectedCategory: 'Wine',
    description: 'Wine Label 2 - ABC Winery American Red Wine',
  },
  {
    imagePaths: ['./test-images/case-1-front.jpeg', './test-images/case-1-back.jpeg'],
    expectedCategory: 'Distilled Spirits',
    description: 'Case 1 (Front + Back) - Ecstasy Pomegranate Liqueur 35% ABV',
  },
  {
    imagePaths: ['./test-images/case-2.jpeg'],
    expectedCategory: 'Wine',
    description: 'Case 2 - Chains North Furnace Mountain Red Wine',
  },
  {
    imagePaths: ['./test-images/case-3-front.jpeg', './test-images/case-3-back.jpeg'],
    expectedCategory: 'Wine',
    description: 'Case 3 (Front + Back) - Otium Cellars Pinot Gris',
  },
];

async function runTest(testCase: TestCase) {
  console.log('\n' + '='.repeat(80));
  console.log(`TEST: ${testCase.description}`);
  console.log('='.repeat(80));
  console.log(`Images: ${testCase.imagePaths.join(', ')}`);
  console.log(`Expected Category: ${testCase.expectedCategory}`);

  try {
    // Check if files exist
    for (const imagePath of testCase.imagePaths) {
      if (!fs.existsSync(imagePath)) {
        console.error(`❌ File not found: ${imagePath}`);
        return;
      }
    }

    // Read images with MIME types
    const images = testCase.imagePaths.map((imagePath) => {
      const buffer = fs.readFileSync(imagePath);
      const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
      return { buffer, mimeType };
    });

    console.log(`\n📸 Processing ${images.length} image(s)...`);

    // Run Vision API extraction
    console.log('\n🔍 Running Vision API extraction...');
    const startTime = Date.now();
    const extractedData = await extractLabelDataWithVision(images);
    const extractionTime = Date.now() - startTime;

    console.log(`✅ Extraction completed in ${(extractionTime / 1000).toFixed(2)}s`);
    console.log('\n📊 Extracted Data:');
    console.log('-'.repeat(80));
    console.log(`Brand Name: ${extractedData.brandName || 'NOT FOUND'}`);
    console.log(`Product Type: ${extractedData.productType || 'NOT FOUND'}`);
    console.log(`TTB Category: ${extractedData.ttbCategory || 'NOT FOUND'}`);
    console.log(`Alcohol Content: ${extractedData.alcoholContent ? extractedData.alcoholContent + '%' : 'NOT FOUND'}`);
    console.log(`Net Contents: ${extractedData.netContents || 'NOT FOUND'}`);
    console.log(`Government Warning: ${extractedData.hasGovernmentWarning ? 'YES' : 'NO'}`);
    console.log('-'.repeat(80));

    // Verify TTB Category
    if (extractedData.ttbCategory === testCase.expectedCategory) {
      console.log(`\n✅ CLASSIFICATION CORRECT: ${extractedData.ttbCategory}`);
      return true;
    } else {
      console.log(`\n❌ CLASSIFICATION INCORRECT:`);
      console.log(`   Expected: ${testCase.expectedCategory}`);
      console.log(`   Got: ${extractedData.ttbCategory || 'null'}`);
      return false;
    }
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error instanceof Error ? error.message : error);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting Vision API Classification Tests');
  console.log(`📁 Testing ${testCases.length} case(s)\n`);

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const result = await runTest(testCase);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('🏁 All tests completed!');
  console.log('='.repeat(80));
  console.log(`✅ Passed: ${passed}/${testCases.length}`);
  console.log(`❌ Failed: ${failed}/${testCases.length}`);
  console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(80) + '\n');
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
