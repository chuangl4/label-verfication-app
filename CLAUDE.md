# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered alcohol label verification application that simulates the TTB (Alcohol and Tobacco Tax and Trade Bureau) label approval process. The app compares information submitted in a form against text extracted from an uploaded label image using Claude Vision API (primary) with Tesseract OCR fallback.

**Core Functionality:**
- Web form for inputting product information (Brand Name, Product Class/Type, Alcohol Content, Net Contents)
- Image upload for alcohol label
- **Dual-Method Processing:**
  - **Primary:** Claude Vision API for intelligent label analysis
  - **Fallback:** Tesseract OCR if Vision API fails
- Verification logic to compare form data against extracted label text
- Results display showing matches/mismatches with detailed feedback

## Key Requirements

### Form Fields to Support
1. **Brand Name** (required) - e.g., "Old Tom Distillery"
2. **Product Class/Type** (required) - e.g., "Kentucky Straight Bourbon Whiskey", "IPA", "Vodka"
3. **Alcohol Content** (required) - ABV percentage, e.g., "45%"
4. **Net Contents** (optional for MVP) - Volume, e.g., "750 mL", "12 fl oz"
5. **Government Warning** (bonus) - Check for "GOVERNMENT WARNING" text presence

### Verification Logic
- Text comparison should be **case-insensitive** where reasonable
- Allow for minor formatting differences (e.g., "Alc 5% by Vol" vs "5%")
- Flag obvious mismatches (completely different brand names or numbers)
- Use text normalization to handle common OCR variations
- Report ALL discrepancies, not just the first one found

### Error Handling Scenarios
1. Matching information (success case)
2. Mismatched information (show specific field differences)
3. Missing fields on label
4. Unreadable/low-quality images (OCR fails)
5. Invalid file uploads

## Technical Constraints

### Technology Choices (Implemented)
- **Frontend**: Next.js 16 (Pages Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Primary Vision AI**: Claude 3.5 Haiku Vision API (Anthropic)
- **Fallback OCR**: Tesseract.js
- **Text Matching**: fuzzball.js (Levenshtein distance, 80% threshold)
- **Deployment**: Vercel (serverless)
- **Database**: Not required - stateless operation

### Scope Considerations
This is designed as a ~1 day project. Prioritize:
1. Core verification functionality over extensive features
2. Clear, working code over complex architecture
3. Proper error handling over edge case perfection
4. Simple, clean UI over elaborate design

## Implementation Notes

### Dual-Method Processing Architecture
**Primary: Claude Vision API**
- Uses Claude 3.5 Haiku model with vision capabilities
- Sends image to Anthropic API with structured prompt
- Returns JSON with all extracted fields (brand, type, ABV, volume, warning)
- Handles small text, unusual fonts, and complex layouts better than OCR
- Requires `ANTHROPIC_API_KEY` environment variable

**Fallback: Tesseract OCR**
- Activates if Vision API fails (missing key, rate limit, API error)
- Extracts raw text from image using Tesseract.js
- Uses regex patterns to find specific information
- Applies fuzzy matching (80% threshold) for field comparison
- Free and works offline

**Fallback Logic in `pages/api/verify.ts`:**
```typescript
try {
  // Attempt Vision API first
  result = await verifyLabelWithVision(formData, imageBuffer);
} catch (visionError) {
  // Fall back to OCR
  ocrText = await extractTextFromImage(imageBuffer);
  result = verifyLabel(formData, ocrText);
}
```

### Why This Architecture?
- **Best Accuracy**: Vision API correctly extracts fields OCR misses (e.g., small "750 ML" text)
- **Resilience**: Never fully breaks - OCR ensures baseline functionality
- **Cost Control**: Free OCR fallback if API budget exhausted
- **No API Key Required**: Works immediately without Anthropic account (degrades to OCR)

### Results Display
- Show clear success/failure indication
- List each field verification result (matched/not matched)
- Include specific details about mismatches (e.g., "Brand name on label ('X') does not match form input ('Y')")
- Handle unreadable images with appropriate error messages

### Optional Bonus Features
- Government warning statement exact text verification
- Image highlighting showing where text was detected
- Multiple product type support (Beer, Wine, Spirits) with different validation rules
- Fuzzy matching for OCR error tolerance (edit distance, regex)
- Automated tests
- Enhanced UX (loading indicators, single-page app behavior, image preview)

## Environment Setup

### Required Environment Variables
```bash
# .env.local
ANTHROPIC_API_KEY=your_api_key_here  # Optional but recommended
```

**Note**: Application works without API key (falls back to OCR), but accuracy is significantly better with Vision API.

## Key Files

- `lib/visionExtraction.ts` - Claude Vision API integration (primary method)
- `lib/ocr.ts` - Tesseract OCR wrapper (fallback method)
- `lib/verification.ts` - Legacy OCR-based verification logic
- `lib/textMatching.ts` - Fuzzy matching and regex patterns for OCR
- `pages/api/verify.ts` - API endpoint with dual-method fallback logic
- `components/VerificationForm.tsx` - Main form with validation
- `components/VerificationResults.tsx` - Success page display

## Deliverables Checklist
- [x] Source code in GitHub repository
- [x] README with local setup instructions
- [x] Documentation of approach, Vision API + OCR, assumptions, limitations
- [x] Dual-method architecture (Vision API primary, OCR fallback)
- [x] Test evidence with wine label images
- [ ] Deployed application with live URL (pending)
