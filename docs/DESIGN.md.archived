# Design Document: AI-Powered Alcohol Label Verification App

## Project Overview

An AI-powered web application that verifies alcohol beverage labels against submitted form data, simulating the TTB (Alcohol and Tobacco Tax and Trade Bureau) label approval process.

**Core Functionality**: Upload a label image + fill form → OCR extracts text → Compare form vs label → Show matches/mismatches

## Tech Stack

### Frontend & Backend
- **Framework**: Next.js 14 (Pages Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Form Management**: React Hook Form
- **Image Upload**: react-dropzone
- **Deployment**: Vercel

### AI/OCR Processing
- **OCR Engine**: Tesseract.js (runs server-side in Next.js API routes)
- **Text Matching**: fuzzball.js (Levenshtein distance-based fuzzy matching)
- **Match Threshold**: 80% similarity

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Client (Browser)                   │
│  ┌────────────────┐         ┌──────────────────┐   │
│  │  Form Page     │────────▶│  Success Page    │   │
│  │  - Input form  │         │  - Congratulations│   │
│  │  - Image upload│         │  - Match details  │   │
│  │  - Error display│        └──────────────────┘   │
│  └────────┬───────┘                                 │
└───────────┼─────────────────────────────────────────┘
            │
            │ POST /api/verify
            │ (FormData: image + fields)
            ▼
┌─────────────────────────────────────────────────────┐
│              Server (Next.js API Routes)             │
│  ┌──────────────────────────────────────────────┐  │
│  │  /api/verify                                  │  │
│  │  1. Receive image + form data                │  │
│  │  2. Run Tesseract.js OCR on image           │  │
│  │  3. Extract text from label                  │  │
│  │  4. Run fuzzy matching (fuzzball.js)        │  │
│  │  5. Compare each field:                      │  │
│  │     - Brand Name                             │  │
│  │     - Product Type                           │  │
│  │     - Alcohol Content                        │  │
│  │     - Net Contents                           │  │
│  │     - Government Warning                     │  │
│  │  6. Return verification results              │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## User Experience Flow

### Success Path
1. User lands on home page with form and image upload area
2. User fills in form fields:
   - Brand Name (text)
   - Product Class/Type (text)
   - Alcohol Content (number + %)
   - Net Contents (text, e.g., "750 mL")
3. User uploads/drags image
4. Image preview appears alongside form
5. User clicks "Verify Label"
6. Loading indicator shows
7. **If all fields match** → Navigate to `/success` page showing:
   - Success message
   - List of verified fields with checkmarks
   - Option to verify another label

### Error Path
1. Steps 1-6 same as above
2. **If any fields don't match** → Stay on same page and:
   - Show error summary at top
   - Highlight mismatched fields in red with specific error messages
   - Show what was expected vs what was found
   - User can edit fields and resubmit
   - Image remains uploaded (no need to re-upload)

### Edge Cases
- **No text found in image**: Show error "Could not read text from image. Please upload a clearer image."
- **Invalid file type**: Show error "Please upload a valid image (JPEG, PNG)"
- **Missing form fields**: Show validation errors before submitting
- **Low OCR confidence**: Still attempt matching, report mismatches

## Component Structure

```
pages/
├── index.tsx                 # Main form page
├── success.tsx              # Success/congratulations page
└── api/
    └── verify.ts            # OCR + verification API endpoint

components/
├── VerificationForm.tsx     # Form with all input fields
├── ImageUpload.tsx          # Drag-and-drop + click upload
├── ImagePreview.tsx         # Display uploaded image
├── FieldError.tsx           # Error message for individual field
└── VerificationResults.tsx  # Success page results display

lib/
├── ocr.ts                   # Tesseract.js wrapper
├── textMatching.ts          # Fuzzy matching logic
└── verification.ts          # Main verification logic

types/
└── index.ts                 # TypeScript interfaces
```

## Data Models

### Form Data (Input)
```typescript
interface FormData {
  brandName: string;
  productType: string;
  alcoholContent: number;  // e.g., 45 for 45%
  netContents: string;     // e.g., "750 mL"
}
```

### OCR Result
```typescript
interface OCRResult {
  text: string;           // Full extracted text
  confidence: number;     // Overall confidence score
}
```

### Verification Result
```typescript
interface VerificationResult {
  success: boolean;
  fields: {
    brandName: FieldResult;
    productType: FieldResult;
    alcoholContent: FieldResult;
    netContents: FieldResult;
    governmentWarning: FieldResult;
  };
}

interface FieldResult {
  matched: boolean;
  expected: string;
  found: string | null;
  similarity?: number;     // 0-100 score
  error?: string;          // Human-readable error message
}
```

### API Response
```typescript
// Success case
{
  success: true,
  fields: { /* all matched */ }
}

// Error case
{
  success: false,
  fields: {
    brandName: {
      matched: false,
      expected: "Old Tom Distillery",
      found: "Tom's Distillery",
      similarity: 75,
      error: "Brand name mismatch (75% similarity, threshold 80%)"
    },
    // ... other fields
  }
}
```

## Verification Logic

### Text Preprocessing
```typescript
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .replace(/[^\w\s%.-]/g, ''); // Keep alphanumeric, %, ., -
}
```

### Fuzzy Matching Rules

1. **Brand Name & Product Type**:
   - Use fuzzball.js `ratio()` for similarity score
   - Threshold: 80%
   - Case-insensitive

2. **Alcohol Content**:
   - Extract numbers from OCR text
   - Look for patterns like "45%", "45% ABV", "45% Alc/Vol"
   - Match if number matches exactly (some tolerance: ±0.5%)

3. **Net Contents**:
   - Extract volume patterns: "750 mL", "12 fl oz", "1 L"
   - Normalize units (ml, mL, ML → ml)
   - Fuzzy match on the full string (80%)

4. **Government Warning**:
   - Search for exact phrase "GOVERNMENT WARNING" (case-insensitive)
   - Optional: Check for key phrases like "Surgeon General", "pregnant"
   - Marked as matched if phrase found anywhere in OCR text

### Matching Algorithm
```typescript
for each field in form:
  1. Normalize form value and OCR text
  2. Apply field-specific matching logic
  3. Calculate similarity score
  4. If score >= 80% → MATCH
  5. If score < 80% → MISMATCH (record details)
  6. If not found in OCR text → MISSING
```

## UI/UX Design

### Form Layout
```
┌────────────────────────────────────────────────────────┐
│  Alcohol Label Verification                            │
├────────────────────┬───────────────────────────────────┤
│  FORM              │  IMAGE PREVIEW                    │
│                    │                                   │
│  Brand Name        │  ┌─────────────────────────────┐ │
│  [____________]    │  │                             │ │
│                    │  │    [Uploaded Image]         │ │
│  Product Type      │  │                             │ │
│  [____________]    │  │                             │ │
│                    │  └─────────────────────────────┘ │
│  Alcohol Content   │                                   │
│  [____] %          │  Drag & drop image here          │
│                    │  or click to upload              │
│  Net Contents      │                                   │
│  [____________]    │                                   │
│                    │                                   │
│  [Upload Image]    │                                   │
│                    │                                   │
│  [ Verify Label ]  │                                   │
└────────────────────┴───────────────────────────────────┘
```

### Error State (Red Highlights)
```
Brand Name  ✗
[Old Tom Distillery]  ← red border
⚠ Brand name mismatch: Found "Tom's Distillery" (75% similarity)
```

### Success Page
```
┌────────────────────────────────────────────────────────┐
│  ✓ Label Verification Successful!                      │
│                                                         │
│  All required information matches the label.           │
│                                                         │
│  Verified Fields:                                      │
│  ✓ Brand Name: Old Tom Distillery                     │
│  ✓ Product Type: Kentucky Straight Bourbon Whiskey    │
│  ✓ Alcohol Content: 45%                               │
│  ✓ Net Contents: 750 mL                               │
│  ✓ Government Warning: Present                        │
│                                                         │
│  [ Verify Another Label ]                             │
└────────────────────────────────────────────────────────┘
```

## API Endpoint Design

### POST /api/verify

**Request**:
```typescript
Content-Type: multipart/form-data

{
  image: File,
  brandName: string,
  productType: string,
  alcoholContent: string,
  netContents: string
}
```

**Response** (200 OK):
```typescript
{
  success: boolean,
  fields: {
    brandName: FieldResult,
    productType: FieldResult,
    alcoholContent: FieldResult,
    netContents: FieldResult,
    governmentWarning: FieldResult
  }
}
```

**Error Response** (400/500):
```typescript
{
  error: string  // "Could not process image" | "Invalid file type" | etc.
}
```

## Testing Strategy

### Manual Testing Scenarios
1. **Perfect match**: All fields match exactly
2. **Case differences**: "OLD TOM DISTILLERY" vs "Old Tom Distillery"
3. **Minor OCR errors**: "O" vs "0", missing spaces
4. **Complete mismatch**: Different brand name
5. **Missing field**: Net contents not on label
6. **Government warning**: Present vs missing
7. **Unreadable image**: Blurry, low-quality
8. **Invalid file**: Upload non-image file

### Test Images Needed
- Bourbon label (all fields present)
- Beer label (different format)
- Wine label (optional)
- Low-quality/blurry image
- Label missing government warning
- Label with different brand name

## Performance Considerations

- **OCR Processing Time**: Tesseract.js can take 2-5 seconds per image
- **Loading Indicator**: Show spinner/progress during verification
- **Image Size Limit**: Recommend max 5MB upload size
- **API Timeout**: Set reasonable timeout (30 seconds) for API route

## Future Enhancements (Out of Scope)

- Image highlighting showing where text was detected
- Support for multiple product types with different validation rules
- Save verification history
- Batch processing multiple labels
- More sophisticated OCR preprocessing (image enhancement, rotation)
- Export verification results as PDF report
