# Test Label Images

This directory contains sample alcohol beverage label images for testing the verification application.

## Test Image Requirements

Each test label should include the following information clearly visible:

### Required Text Elements

1. **Brand Name** - e.g., "Old Tom Distillery"
2. **Product Class/Type** - e.g., "Kentucky Straight Bourbon Whiskey", "IPA", "Vodka"
3. **Alcohol Content** - e.g., "45% ABV", "5.0% Alc/Vol"
4. **Net Contents** - e.g., "750 mL", "12 fl oz"
5. **Government Warning** - Must include "GOVERNMENT WARNING" text

## Recommended Test Scenarios

### 1. Perfect Match (`test-bourbon-perfect.png`)
- All fields exactly match the form input
- Clear, high-quality image
- All text easily readable

### 2. Fuzzy Match (`test-bourbon-fuzzy.png`)
- Minor OCR variations (e.g., "OLD TOM" vs "Old Tom")
- Tests the 80% fuzzy matching threshold
- Should still pass verification

### 3. Brand Mismatch (`test-bourbon-wrong-brand.png`)
- Different brand name than form input
- Should fail with clear error message

### 4. Missing ABV (`test-beer-no-abv.png`)
- Label missing alcohol content percentage
- Should fail verification

### 5. No Government Warning (`test-wine-no-warning.png`)
- Label without required warning statement
- Should fail government warning check

### 6. Low Quality (`test-blurry.png`)
- Blurry or low-resolution image
- Tests OCR error handling
- May fail with "could not read text" error

### 7. Different Product Types
- `test-beer-ipa.png` - Beer label example
- `test-wine-red.png` - Wine label example
- `test-vodka.png` - Distilled spirits example

## Creating Test Images

You can create test images using:
- Image editing software (Photoshop, Canva, etc.)
- AI image generators (DALL-E, Midjourney, etc.)
- Real product photos (for testing purposes only)

## File Naming Convention

Use descriptive names:
- `test-[product-type]-[scenario].png`
- Examples:
  - `test-bourbon-perfect-match.png`
  - `test-ipa-missing-warning.png`
  - `test-vodka-wrong-abv.png`

## Notes

- Images should be JPEG, PNG, or WebP format
- Recommended max size: 5MB
- Higher resolution = better OCR accuracy
- Ensure text is clearly visible and not too small
