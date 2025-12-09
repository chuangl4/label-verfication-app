/**
 * Test script for TTB Product Type Classifier
 * Run with: npx tsx test-classifier.ts
 */

import { classifyProductType, categoriesMatch } from './lib/productTypeClassifier';

console.log('=== TTB Product Type Classifier Tests ===\n');

const testCases = [
  // Wine tests
  { input: 'Red Wine', expectedCategory: 'Wine' },
  { input: 'Cabernet Sauvignon', expectedCategory: 'Wine' },
  { input: 'Chardonnay', expectedCategory: 'Wine' },
  { input: 'Champagne', expectedCategory: 'Wine' },
  { input: 'Sparkling Wine', expectedCategory: 'Wine' },
  { input: 'Port', expectedCategory: 'Wine' },

  // Distilled Spirits tests
  { input: 'Kentucky Straight Bourbon Whiskey', expectedCategory: 'Distilled Spirits' },
  { input: 'Bourbon', expectedCategory: 'Distilled Spirits' },
  { input: 'Whiskey', expectedCategory: 'Distilled Spirits' },
  { input: 'Vodka', expectedCategory: 'Distilled Spirits' },
  { input: 'Gin', expectedCategory: 'Distilled Spirits' },
  { input: 'Tequila', expectedCategory: 'Distilled Spirits' },
  { input: 'Rum', expectedCategory: 'Distilled Spirits' },
  { input: 'Single Malt Scotch', expectedCategory: 'Distilled Spirits' },

  // Malt Beverage tests
  { input: 'Beer', expectedCategory: 'Malt Beverage' },
  { input: 'IPA', expectedCategory: 'Malt Beverage' },
  { input: 'India Pale Ale', expectedCategory: 'Malt Beverage' },
  { input: 'Stout', expectedCategory: 'Malt Beverage' },
  { input: 'Lager', expectedCategory: 'Malt Beverage' },
  { input: 'Hard Seltzer', expectedCategory: 'Malt Beverage' },
  { input: 'Cider', expectedCategory: 'Malt Beverage' },
];

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  const result = classifyProductType(testCase.input);
  const matches = result.category && categoriesMatch(result.category, testCase.expectedCategory);

  if (matches) {
    console.log(`✓ "${testCase.input}" → ${result.category} (${result.confidence}% confidence, keyword: "${result.matchedKeyword}")`);
    passed++;
  } else {
    console.log(`✗ "${testCase.input}" → ${result.category || 'null'} (expected ${testCase.expectedCategory})`);
    failed++;
  }
}

console.log(`\n=== Results ===`);
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Failed: ${failed}/${testCases.length}`);
console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
