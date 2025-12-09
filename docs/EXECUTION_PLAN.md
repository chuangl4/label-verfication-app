# Execution Plan: Label Verification App

## Overview

This document breaks down the implementation into small, manageable tasks. Each task should be completable in 15-30 minutes.

## Phase 1: Project Setup & Foundation

### Task 1.1: Initialize Next.js Project
- [ ] Create Next.js app with TypeScript: `npx create-next-app@latest`
- [ ] Select options: TypeScript (Yes), Tailwind CSS (Yes), App Router (No - use Pages)
- [ ] Verify project structure
- [ ] Run dev server to confirm setup: `npm run dev`

**Dependencies**: None
**Estimated Time**: 5 minutes

### Task 1.2: Install Additional Dependencies
- [ ] Install React Hook Form: `npm install react-hook-form`
- [ ] Install react-dropzone: `npm install react-dropzone`
- [ ] Install Tesseract.js: `npm install tesseract.js`
- [ ] Install fuzzball: `npm install fuzzball`
- [ ] Install types: `npm install -D @types/fuzzball`

**Dependencies**: Task 1.1
**Estimated Time**: 5 minutes

### Task 1.3: Create Project Structure
- [ ] Create `components/` directory
- [ ] Create `lib/` directory
- [ ] Create `types/` directory
- [ ] Create `public/` subdirectories if needed
- [ ] Update `.gitignore` if necessary

**Dependencies**: Task 1.1
**Estimated Time**: 5 minutes

### Task 1.4: Define TypeScript Types
- [ ] Create `types/index.ts`
- [ ] Define `FormData` interface
- [ ] Define `OCRResult` interface
- [ ] Define `VerificationResult` interface
- [ ] Define `FieldResult` interface
- [ ] Export all types

**Dependencies**: Task 1.3
**Estimated Time**: 10 minutes

---

## Phase 2: Backend Implementation (API Route)

### Task 2.1: Create OCR Utility
- [ ] Create `lib/ocr.ts`
- [ ] Import Tesseract.js
- [ ] Write `extractTextFromImage()` function
- [ ] Accept image buffer/base64 as input
- [ ] Return OCR text and confidence score
- [ ] Add error handling for invalid images

**Dependencies**: Task 1.2, 1.4
**Estimated Time**: 20 minutes

### Task 2.2: Create Text Matching Utility
- [ ] Create `lib/textMatching.ts`
- [ ] Import fuzzball
- [ ] Write `normalizeText()` function
- [ ] Write `fuzzyMatch()` function (80% threshold)
- [ ] Write `findAlcoholContent()` function (regex for percentages)
- [ ] Write `findNetContents()` function (regex for volumes)
- [ ] Write `findGovernmentWarning()` function

**Dependencies**: Task 1.2, 1.4
**Estimated Time**: 30 minutes

### Task 2.3: Create Verification Logic
- [ ] Create `lib/verification.ts`
- [ ] Import text matching utilities
- [ ] Write `verifyBrandName()` function
- [ ] Write `verifyProductType()` function
- [ ] Write `verifyAlcoholContent()` function
- [ ] Write `verifyNetContents()` function
- [ ] Write `verifyGovernmentWarning()` function
- [ ] Write main `verifyLabel()` function that calls all verifiers
- [ ] Return structured `VerificationResult`

**Dependencies**: Task 2.2, 1.4
**Estimated Time**: 30 minutes

### Task 2.4: Create API Route
- [ ] Create `pages/api/verify.ts`
- [ ] Set up API route handler
- [ ] Parse multipart form data (image + fields)
- [ ] Call OCR utility with uploaded image
- [ ] Call verification logic with OCR results + form data
- [ ] Return JSON response with verification results
- [ ] Add error handling (invalid file, OCR errors, etc.)
- [ ] Add TypeScript types for request/response

**Dependencies**: Task 2.1, 2.3
**Estimated Time**: 30 minutes

---

## Phase 3: Frontend Components

### Task 3.1: Create Image Upload Component
- [ ] Create `components/ImageUpload.tsx`
- [ ] Import react-dropzone
- [ ] Set up dropzone with click and drag-and-drop
- [ ] Accept only image files (JPEG, PNG)
- [ ] Emit uploaded file to parent component
- [ ] Add visual feedback for drag over state
- [ ] Style with Tailwind (border, background, hover states)

**Dependencies**: Task 1.2
**Estimated Time**: 25 minutes

### Task 3.2: Create Image Preview Component
- [ ] Create `components/ImagePreview.tsx`
- [ ] Accept image file as prop
- [ ] Display image with proper sizing
- [ ] Add remove/clear button
- [ ] Style with Tailwind (border, shadow)

**Dependencies**: None
**Estimated Time**: 15 minutes

### Task 3.3: Create Field Error Component
- [ ] Create `components/FieldError.tsx`
- [ ] Accept error message as prop
- [ ] Display with red text and warning icon
- [ ] Style with Tailwind

**Dependencies**: None
**Estimated Time**: 10 minutes

### Task 3.4: Create Verification Form Component
- [ ] Create `components/VerificationForm.tsx`
- [ ] Set up React Hook Form
- [ ] Add form fields:
  - [ ] Brand Name input
  - [ ] Product Type input
  - [ ] Alcohol Content input (number)
  - [ ] Net Contents input
- [ ] Add validation rules (all required)
- [ ] Integrate ImageUpload component
- [ ] Integrate ImagePreview component
- [ ] Add submit button with loading state
- [ ] Add conditional error styling (red borders)
- [ ] Display field errors using FieldError component
- [ ] Style form with Tailwind (grid layout, spacing)

**Dependencies**: Task 3.1, 3.2, 3.3, 1.2
**Estimated Time**: 40 minutes

### Task 3.5: Create Success Results Component
- [ ] Create `components/VerificationResults.tsx`
- [ ] Accept `VerificationResult` as prop
- [ ] Display success message with checkmarks
- [ ] List all verified fields with values
- [ ] Add "Verify Another Label" button
- [ ] Style with Tailwind (green colors, checkmarks)

**Dependencies**: Task 1.4
**Estimated Time**: 20 minutes

---

## Phase 4: Pages Implementation

### Task 4.1: Create Main Form Page
- [ ] Update `pages/index.tsx`
- [ ] Import VerificationForm component
- [ ] Add page title and description
- [ ] Create two-column layout (form left, image preview right)
- [ ] Handle form submission
- [ ] Call `/api/verify` endpoint
- [ ] Handle success: Navigate to `/success` with results in query/state
- [ ] Handle errors: Display errors on form fields
- [ ] Add loading state during API call
- [ ] Style page with Tailwind

**Dependencies**: Task 3.4, 2.4
**Estimated Time**: 35 minutes

### Task 4.2: Create Success Page
- [ ] Create `pages/success.tsx`
- [ ] Import VerificationResults component
- [ ] Receive verification results from navigation state/query
- [ ] Display results using VerificationResults component
- [ ] Add "Verify Another Label" button linking to home
- [ ] Handle case where results are missing (redirect to home)
- [ ] Style page with Tailwind

**Dependencies**: Task 3.5
**Estimated Time**: 20 minutes

---

## Phase 5: Styling & Polish

### Task 5.1: Add Global Styles
- [ ] Update `styles/globals.css` if needed
- [ ] Configure Tailwind theme (colors, fonts)
- [ ] Add any custom CSS for specific components
- [ ] Ensure consistent spacing and typography

**Dependencies**: All component tasks
**Estimated Time**: 15 minutes

### Task 5.2: Add Loading States
- [ ] Add spinner/loading indicator component
- [ ] Show during API call on form page
- [ ] Disable form during submission
- [ ] Add visual feedback

**Dependencies**: Task 4.1
**Estimated Time**: 15 minutes

### Task 5.3: Improve Error Messages
- [ ] Review all error messages for clarity
- [ ] Add specific error details (expected vs found)
- [ ] Format error messages consistently
- [ ] Add helpful hints (e.g., "Try uploading a clearer image")

**Dependencies**: Task 4.1, 2.4
**Estimated Time**: 15 minutes

### Task 5.4: Responsive Design Check
- [ ] Test on mobile viewport
- [ ] Adjust layout for smaller screens (stack form and image)
- [ ] Ensure buttons and inputs are touch-friendly
- [ ] Fix any overflow or layout issues

**Dependencies**: All UI tasks
**Estimated Time**: 20 minutes

---

## Phase 6: Testing & Bug Fixes

### Task 6.1: Create Test Images
- [ ] Create/find bourbon label image with all fields
- [ ] Create/find beer label image
- [ ] Create low-quality blurry image
- [ ] Create label missing government warning
- [ ] Create label with mismatched brand name
- [ ] Save test images in `public/test-images/` or local folder

**Dependencies**: None
**Estimated Time**: 20 minutes

### Task 6.2: Manual Testing - Happy Path
- [ ] Test with perfect matching label
- [ ] Verify all fields show as matched
- [ ] Verify navigation to success page
- [ ] Verify "Verify Another Label" button works

**Dependencies**: All implementation tasks, Task 6.1
**Estimated Time**: 10 minutes

### Task 6.3: Manual Testing - Error Cases
- [ ] Test with mismatched brand name
- [ ] Test with wrong alcohol content
- [ ] Test with missing government warning
- [ ] Test with unreadable image
- [ ] Verify errors show on form
- [ ] Verify red highlighting works
- [ ] Verify user can edit and resubmit

**Dependencies**: All implementation tasks, Task 6.1
**Estimated Time**: 20 minutes

### Task 6.4: Manual Testing - Edge Cases
- [ ] Test with invalid file type (e.g., PDF)
- [ ] Test with very large image
- [ ] Test with empty form submission
- [ ] Test case sensitivity (e.g., "OLD TOM" vs "old tom")
- [ ] Fix any bugs discovered

**Dependencies**: All implementation tasks
**Estimated Time**: 20 minutes

### Task 6.5: Fix Bugs & Refinements
- [ ] Address any bugs found during testing
- [ ] Improve OCR accuracy if needed (preprocessing)
- [ ] Adjust fuzzy match threshold if too strict/loose
- [ ] Refine UI based on testing experience

**Dependencies**: Task 6.2, 6.3, 6.4
**Estimated Time**: 30 minutes (variable)

---

## Phase 7: Documentation

### Task 7.1: Write README
- [ ] Create comprehensive `README.md`
- [ ] Add project description
- [ ] Add setup instructions (clone, install, run)
- [ ] Add environment variable instructions (if any)
- [ ] Document tech stack and libraries used
- [ ] Add usage instructions
- [ ] Document approach and key decisions
- [ ] Note any assumptions or limitations
- [ ] Add screenshots (optional)

**Dependencies**: All implementation complete
**Estimated Time**: 30 minutes

### Task 7.2: Code Cleanup
- [ ] Remove console.logs
- [ ] Remove commented-out code
- [ ] Ensure consistent code formatting
- [ ] Add comments for complex logic
- [ ] Check for unused imports

**Dependencies**: All implementation complete
**Estimated Time**: 15 minutes

---

## Phase 8: Deployment

### Task 8.1: Prepare for Deployment
- [ ] Ensure all dependencies are in `package.json`
- [ ] Test build locally: `npm run build`
- [ ] Fix any build errors or warnings
- [ ] Verify production build works: `npm start`

**Dependencies**: All implementation complete
**Estimated Time**: 15 minutes

### Task 8.2: Deploy to Vercel
- [ ] Create Vercel account (if needed)
- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Run `vercel` in project directory
- [ ] Follow prompts to deploy
- [ ] Verify deployment URL works
- [ ] Test deployed app with all test cases

**Dependencies**: Task 8.1
**Estimated Time**: 15 minutes

### Task 8.3: Final Verification
- [ ] Test deployed app with all test images
- [ ] Verify OCR works in production
- [ ] Check loading times
- [ ] Test on different browsers
- [ ] Fix any production-specific issues

**Dependencies**: Task 8.2
**Estimated Time**: 20 minutes

---

## Phase 9: Submission

### Task 9.1: Prepare Repository
- [ ] Ensure all code is committed
- [ ] Push to GitHub
- [ ] Verify repository is public (or accessible)
- [ ] Check README is visible on GitHub

**Dependencies**: Task 7.1, 8.3
**Estimated Time**: 10 minutes

### Task 9.2: Create Submission Package
- [ ] Collect deployment URL
- [ ] Collect GitHub repository URL
- [ ] Take screenshots of app in action (optional)
- [ ] Write submission notes/comments
- [ ] Prepare email/submission

**Dependencies**: Task 9.1
**Estimated Time**: 15 minutes

---

## Summary

**Total Estimated Time**: ~8-10 hours (includes buffer for debugging)

### Critical Path
1. Project Setup (Phase 1) → 25 min
2. Backend/API (Phase 2) → 110 min
3. Frontend Components (Phase 3) → 110 min
4. Pages (Phase 4) → 55 min
5. Polish (Phase 5) → 65 min
6. Testing (Phase 6) → 100 min
7. Documentation (Phase 7) → 45 min
8. Deployment (Phase 8) → 50 min
9. Submission (Phase 9) → 25 min

### Dependencies Graph
```
Phase 1 (Setup)
    ↓
Phase 2 (Backend) ────┐
    ↓                  │
Phase 3 (Components)  │
    ↓                  │
Phase 4 (Pages) ←──────┘
    ↓
Phase 5 (Polish)
    ↓
Phase 6 (Testing)
    ↓
Phase 7 (Docs)
    ↓
Phase 8 (Deploy)
    ↓
Phase 9 (Submit)
```

### Parallelization Opportunities
- Tasks 2.1 and 2.2 can be done in parallel
- Tasks 3.1, 3.2, 3.3 can be done in parallel
- Testing different scenarios (6.2, 6.3, 6.4) can overlap

### Risk Areas
- **OCR accuracy**: May need to adjust preprocessing or thresholds
- **Fuzzy matching**: 80% threshold might need tuning
- **Image upload**: Large files might need size limits
- **Deployment**: Tesseract.js might have different behavior in production

### Next Steps
Start with Phase 1, Task 1.1!
