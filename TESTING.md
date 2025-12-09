# Testing Guide

This document provides comprehensive information about the testing setup, philosophy, and practices for the AI-Powered Alcohol Label Verification App.

> **Note on Testing Scope**: The production application uses **Claude Vision API only** for label extraction. However, the test suite includes tests for OCR-based functions (`lib/ocr.ts`, `lib/verification.ts`, `lib/textMatching.ts`) to maintain code coverage and preserve functionality for potential future use. These OCR functions are NOT used in the production API (`pages/api/verify.ts`).

## Table of Contents

- [Overview](#overview)
- [Test Coverage](#test-coverage)
- [Quick Start](#quick-start)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Mocking Strategies](#mocking-strategies)
- [Integration Testing](#integration-testing)
- [Troubleshooting](#troubleshooting)

## Overview

This project uses **Jest** as the testing framework with **React Testing Library** for component tests. The test suite includes:

- **Unit Tests**: Testing individual functions and modules in isolation
- **Integration Tests**: Testing with real label images using Vision API
- **Component Tests**: Testing React components with user interactions

**Production Architecture**: Claude Vision API only (no OCR fallback)
**Test Coverage**: Includes both Vision API tests AND legacy OCR function tests

**Total Test Count**: 149 tests (122 unit tests + 27 integration tests)

**Coverage Metrics**: 54.3% statements, 51.29% branches, 50% functions, 54.3% lines

## Test Coverage

### Coverage Breakdown by File Type

| Category | Files | Tests | Status | Purpose |
|----------|-------|-------|--------|---------|
| **Vision API** | `lib/visionExtraction.test.ts` | 15 | **Production** | Claude Vision API integration |
| **Components** | `components/VerificationForm.test.tsx` | 12 | **Production** | Form validation and submission |
| **Integration** | `__tests__/integration/*.test.ts` | 27 | **Production** | Real image processing with Vision API |
| **Text Processing** | `lib/textMatching.test.ts` | 62 | Legacy/Testing | Fuzzy matching, regex patterns (not used in prod) |
| **OCR Verification** | `lib/verification.test.ts` | 27 | Legacy/Testing | OCR-based verification logic (not used in prod) |
| **OCR Wrapper** | `lib/ocr.test.ts` | 14 | Legacy/Testing | Tesseract.js wrapper (not used in prod) |

**Production Tests** (54 tests): Tests for code actually used in the live application
**Legacy Tests** (103 tests): Tests for OCR functions preserved for code coverage and potential future use

### Coverage Thresholds

The project enforces minimum coverage thresholds:

```javascript
coverageThreshold: {
  global: {
    branches: 50,
    functions: 50,
    lines: 50,
    statements: 50,
  },
}
```

## Quick Start

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm run test:coverage
```

Coverage report will be generated in `coverage/` directory. Open `coverage/lcov-report/index.html` in a browser to view detailed coverage.

### Run Integration Tests with Vision API

```bash
# Set API key and run integration tests
ANTHROPIC_API_KEY=your_api_key_here npm test -- __tests__/integration

# Or run all tests with API key
ANTHROPIC_API_KEY=your_api_key_here npm test
```

### Run Specific Test File

```bash
npm test -- lib/textMatching.test.ts
```

### Run Tests Matching Pattern

```bash
npm test -- --testNamePattern="government warning"
```

## Test Structure

### Directory Organization

```
label-verfication-app/
├── lib/
│   ├── textMatching.ts
│   ├── textMatching.test.ts        # 62 unit tests
│   ├── verification.ts
│   ├── verification.test.ts        # 27 unit tests
│   ├── visionExtraction.ts
│   ├── visionExtraction.test.ts    # 15 unit tests
│   ├── ocr.ts
│   └── ocr.test.ts                 # 14 unit tests
├── components/
│   ├── VerificationForm.tsx
│   └── VerificationForm.test.tsx   # 12 component tests
└── __tests__/
    └── integration/
        ├── image-processing.test.ts           # 16 integration tests
        └── test-image-expectations.test.ts    # 11 integration tests
```

### Test File Naming Convention

- Unit tests: `[filename].test.ts` (colocated with source)
- Integration tests: `__tests__/integration/[description].test.ts`
- Component tests: `[ComponentName].test.tsx` (colocated with component)

## Running Tests

### Test Scripts

| Command | Purpose |
|---------|---------|
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode (re-runs on file changes) |
| `npm run test:coverage` | Run tests and generate coverage report |

### Environment-Specific Tests

#### Node Environment (Integration Tests)

Integration tests use Node environment for file system access:

```typescript
/**
 * @jest-environment node
 */
```

#### jsdom Environment (Component Tests)

Component tests use jsdom environment (default):

```typescript
// No annotation needed, jsdom is default
```

### Conditional Tests

Some tests are conditional based on environment:

```typescript
// Skip if API key not set
const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

if (!hasApiKey) {
  console.log('Skipping: ANTHROPIC_API_KEY not set');
  return;
}
```

```typescript
// Skip if test image doesn't exist
if (!testImageExists('wine-label-1.png')) {
  console.log('Skipping: wine-label-1.png not found');
  return;
}
```

## Writing Tests

### Unit Test Example

```typescript
import { fuzzyMatch } from './textMatching';

describe('fuzzyMatch', () => {
  it('should return 100 for identical strings', () => {
    const result = fuzzyMatch('test', 'test');
    expect(result).toBe(100);
  });

  it('should be case insensitive', () => {
    const result = fuzzyMatch('TEST', 'test');
    expect(result).toBe(100);
  });

  it('should handle partial matches', () => {
    const result = fuzzyMatch('Kentucky Bourbon', 'Kentucky Straight Bourbon Whiskey');
    expect(result).toBeGreaterThan(60);
  });
});
```

### Component Test Example

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VerificationForm from './VerificationForm';

describe('VerificationForm', () => {
  it('should display validation error for empty brand name', async () => {
    render(<VerificationForm />);

    const submitButton = screen.getByRole('button', { name: /verify label/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/brand name is required/i)).toBeInTheDocument();
    });
  });
});
```

### Integration Test Example

```typescript
import { extractTextFromImage } from '@/lib/ocr';
import fs from 'fs';
import path from 'path';

describe('OCR Integration', () => {
  it('should extract text from wine label', async () => {
    const imagePath = path.join(process.cwd(), 'test-images', 'wine-label-1.png');
    const imageBuffer = fs.readFileSync(imagePath);

    const result = await extractTextFromImage(imageBuffer);

    expect(result.text).toBeDefined();
    expect(result.text.toLowerCase()).toMatch(/government.*warning/i);
  }, 30000); // 30 second timeout
});
```

### Best Practices

1. **Use Descriptive Test Names**: Test names should clearly state what is being tested
   ```typescript
   // Good
   it('should return not matched when brand name is not found', () => { ... });

   // Bad
   it('test brand name', () => { ... });
   ```

2. **Arrange-Act-Assert Pattern**:
   ```typescript
   it('should calculate average confidence correctly', () => {
     // Arrange
     const mockBuffers = [Buffer.from('image1'), Buffer.from('image2')];

     // Act
     const result = await extractTextFromMultipleImages(mockBuffers);

     // Assert
     expect(result.averageConfidence).toBe(80);
   });
   ```

3. **Test One Thing Per Test**: Each test should verify a single behavior

4. **Use Appropriate Timeouts**: OCR and API tests need longer timeouts
   ```typescript
   it('should process image', async () => {
     // Test code
   }, 30000); // 30 seconds
   ```

5. **Clean Up Mocks**: Reset mocks between tests
   ```typescript
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

## Mocking Strategies

### Mocking External Dependencies

#### Mock Anthropic SDK

```typescript
jest.mock('@anthropic-ai/sdk');

const mockCreate = jest.fn();
(Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => ({
  messages: {
    create: mockCreate,
  },
} as any));
```

#### Mock Tesseract

```typescript
jest.mock('tesseract.js', () => ({
  recognize: jest.fn(),
}));

const mockRecognize = Tesseract.recognize as jest.Mock;
mockRecognize.mockResolvedValue({
  data: {
    text: 'Extracted text',
    confidence: 85,
  },
});
```

#### Mock Next.js Router

```typescript
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
  push: mockPush,
  query: {},
});
```

### Partial Mocking

When you need real implementation for some functions:

```typescript
jest.mock('./textMatching', () => {
  const actual = jest.requireActual('./textMatching');
  return {
    ...actual,
    findBestMatch: jest.fn(), // Mock this one
    normalizeVolumeUnit: actual.normalizeVolumeUnit, // Use real implementation
  };
});
```

### Mock Implementation with Dynamic Return Values

```typescript
(textMatching.findBestMatch as jest.Mock).mockImplementation((searchTerm: string) => {
  if (searchTerm === 'Old Tom Distillery') {
    return { match: 'Old Tom Distillery', score: 95 };
  } else if (searchTerm === 'Distilled Spirits') {
    return { match: 'Distilled Spirits', score: 95 };
  }
  return null;
});
```

### Cleanup Mocks

```typescript
beforeEach(() => {
  jest.clearAllMocks(); // Clear call history
});

afterEach(() => {
  jest.restoreAllMocks(); // Restore original implementations
});
```

## Integration Testing

> **Production Note**: The production application (`pages/api/verify.ts`) uses **Vision API only**. Integration tests include both Vision API tests (which mirror production) and OCR tests (for code coverage and preservation of legacy functionality).

### Real Image Testing

Integration tests use actual label images from `test-images/` directory:

```typescript
function loadTestImage(filename: string): Buffer {
  const imagePath = path.join(process.cwd(), 'test-images', filename);
  return fs.readFileSync(imagePath);
}

function testImageExists(filename: string): boolean {
  const imagePath = path.join(process.cwd(), 'test-images', filename);
  return fs.existsSync(imagePath);
}
```

### Test Image Documentation

See [`test-images/README.md`](./test-images/README.md) for:
- Available test images
- Expected extraction results
- Image quality guidelines

See [`test-images/TEST_RESULTS.md`](./test-images/TEST_RESULTS.md) for:
- Documented OCR results
- Vision API extraction results
- Known limitations per image

### Multi-Image Processing

Testing front + back label combinations:

```typescript
it('should process case-1 front and back', async () => {
  if (!testImageExists('case-1-front.jpeg') || !testImageExists('case-1-back.jpeg')) {
    console.log('Skipping: case-1 images not found');
    return;
  }

  const frontBuffer = loadTestImage('case-1-front.jpeg');
  const backBuffer = loadTestImage('case-1-back.jpeg');

  const result = await extractTextFromMultipleImages([frontBuffer, backBuffer]);

  expect(result.images).toHaveLength(2);
  expect(result.combinedText).toContain('IMAGE SEPARATOR');
}, 60000); // 60 seconds for 2 images
```

### Vision API vs OCR Comparison (Test Only)

Testing both methods on same image for comparison (OCR not used in production):

```typescript
it('should compare OCR vs Vision API on same image', async () => {
  const imageBuffer = loadTestImage('case-2.jpeg');

  // Extract with both methods
  const ocrResult = await extractTextFromImage(imageBuffer);
  const visionResult = await extractLabelDataWithVision([
    { buffer: imageBuffer, mimeType: 'image/jpeg' },
  ]);

  // Both should extract some text
  expect(ocrResult.text.length).toBeGreaterThan(0);
  expect(visionResult.brandName || visionResult.productType).toBeTruthy();
}, 45000);
```

### Performance Testing

```typescript
it('should process Vision API within reasonable time', async () => {
  const imageBuffer = loadTestImage('case-2.jpeg');
  const startTime = Date.now();

  await extractLabelDataWithVision([
    { buffer: imageBuffer, mimeType: 'image/jpeg' },
  ]);

  const duration = Date.now() - startTime;

  // Vision API should complete within 10 seconds
  expect(duration).toBeLessThan(10000);
}, 30000);
```

## Troubleshooting

### Common Issues

#### Issue: Tests timeout

**Symptom**: Tests fail with "Exceeded timeout of 5000 ms"

**Solution**: Increase timeout for OCR/API tests:
```typescript
it('should process image', async () => {
  // Test code
}, 30000); // 30 seconds
```

Or globally in `jest.config.js`:
```javascript
testTimeout: 30000,
```

#### Issue: Mock not working

**Symptom**: Mock function not being called or wrong values returned

**Solution**: Ensure mock is set up before importing the module:
```typescript
// Mock BEFORE import
jest.mock('./textMatching');

// Import AFTER mock
import { findBestMatch } from './textMatching';
```

#### Issue: Integration tests fail without images

**Symptom**: "ENOENT: no such file or directory, open 'test-images/...'"

**Solution**: Check that test images exist:
```typescript
if (!testImageExists('wine-label-1.png')) {
  console.log('Skipping: wine-label-1.png not found');
  return;
}
```

#### Issue: Vision API tests fail

**Symptom**: Vision API tests are skipped or fail with authentication errors

**Solution**: Set `ANTHROPIC_API_KEY` environment variable:
```bash
ANTHROPIC_API_KEY=your_key npm test
```

#### Issue: Coverage below threshold

**Symptom**: "Coverage for statements (45%) does not meet global threshold (50%)"

**Solution**: Write more tests or adjust threshold in `jest.config.js`:
```javascript
coverageThreshold: {
  global: {
    statements: 45, // Lower threshold temporarily
  },
}
```

#### Issue: Boolean type coercion errors

**Symptom**: `expect(received).toBe(expected)` Expected: true, Received: "string"

**Solution**: Use `!!` operator to coerce to boolean:
```typescript
// Before
const hasData = result.brandName || result.productType;
expect(hasData).toBe(true);

// After
const hasData = !!(result.brandName || result.productType);
expect(hasData).toBe(true);
```

#### Issue: Jest can't parse TypeScript in integration tests

**Symptom**: "Unexpected token, expected ','"

**Solution**: Add `@jest-environment node` comment at top of file:
```typescript
/**
 * @jest-environment node
 */
```

### Debugging Tests

#### Run Single Test

```bash
npm test -- lib/textMatching.test.ts
```

#### Run Tests Matching Pattern

```bash
npm test -- --testNamePattern="brand name"
```

#### Verbose Output

```bash
npm test -- --verbose
```

#### See Console Logs

```bash
npm test -- --silent=false
```

#### Debug in VS Code

Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Getting Help

1. Check [Jest Documentation](https://jestjs.io/docs/getting-started)
2. Check [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
3. Review existing test files for examples
4. Check test-images/TEST_RESULTS.md for expected behavior

## Test Coverage Goals

### Current Status

- **Statements**: 54.3% ✅
- **Branches**: 51.29% ✅
- **Functions**: 50% ✅
- **Lines**: 54.3% ✅

### Future Goals

- [ ] Increase coverage to 70%+ for critical paths
- [ ] Add API endpoint tests (`pages/api/verify.ts`)
- [ ] Add more edge case tests
- [ ] Add visual regression tests for UI components
- [ ] Add E2E tests with Playwright or Cypress

## Contributing

When adding new features:

1. Write tests BEFORE implementation (TDD)
2. Ensure tests pass: `npm test`
3. Ensure coverage thresholds met: `npm run test:coverage`
4. Add integration tests if adding image processing features
5. Update this documentation if adding new test patterns

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Jest Mocking Guide](https://jestjs.io/docs/mock-functions)
- [Test Images Documentation](./test-images/README.md)
- [Test Results Documentation](./test-images/TEST_RESULTS.md)
