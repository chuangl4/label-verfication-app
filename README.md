# AI-Powered Alcohol Label Verification App

An AI-powered web application that simulates the TTB (Alcohol and Tobacco Tax and Trade Bureau) label approval process. The app uses OCR technology to extract text from alcohol beverage labels and verifies that the information matches the submitted application form.

## 🌟 Features

- **Smart Form Input**: Easy-to-use form for entering product information (brand name, product type, alcohol content, net contents)
- **Drag & Drop Image Upload**: Support for both click-to-upload and drag-and-drop image selection
- **AI-Powered Vision Analysis**: Claude Vision API (primary) with Tesseract OCR fallback for resilient label extraction
- **Intelligent Matching**: Context-aware verification with high accuracy
- **Automatic Fallback**: Gracefully degrades to OCR if Vision API is unavailable
- **Comprehensive Verification**: Validates all required fields including:
  - Brand Name
  - Product Class/Type
  - Alcohol Content (ABV %)
  - Net Contents (volume)
  - Government Warning Statement
- **User-Friendly Results**: Clear success/error feedback with specific mismatch details
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Live Demo

**Deployed Application**: [URL will be added after deployment]

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (Pages Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Form Management**: React Hook Form
- **Image Upload**: react-dropzone

### Backend
- **API**: Next.js API Routes (serverless functions)
- **Vision AI (Primary)**: Claude 3.5 Haiku Vision API (Anthropic)
- **OCR (Fallback)**: Tesseract.js
- **Text Matching (Fallback)**: fuzzball.js (Levenshtein distance)
- **File Handling**: formidable

### Deployment
- **Platform**: Vercel
- **Runtime**: Node.js

## 📋 Prerequisites

- Node.js 18.x or higher
- npm or yarn
- **Anthropic API Key** (get one at [https://console.anthropic.com/](https://console.anthropic.com/))

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd label-verfication-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Then add your Anthropic API key:

```
ANTHROPIC_API_KEY=your_api_key_here
```

**Important**: Get your API key from [https://console.anthropic.com/](https://console.anthropic.com/)

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 5. Build for Production

```bash
npm run build
npm start
```

## 📖 Usage

### Basic Workflow

1. **Navigate to the Home Page**
   - Fill in the product information form with:
     - Brand Name (e.g., "Old Tom Distillery")
     - Product Class/Type (e.g., "Kentucky Straight Bourbon Whiskey")
     - Alcohol Content (e.g., "45")
     - Net Contents (e.g., "750 mL")

2. **Upload Label Image**
   - Click to browse or drag-and-drop a label image
   - Supported formats: JPEG, PNG, WebP (max 10MB)

3. **Verify Label**
   - Click "Verify Label" button
   - The app will process the image using Claude Vision API

4. **View Results**
   - **Success**: Navigate to success page showing all verified fields
   - **Errors**: Stay on form page with specific error messages highlighted

### Example Test Cases

See [`test-images/README.md`](./test-images/README.md) for detailed test scenarios and image requirements.

## 🏗️ Project Structure

```
label-verfication-app/
├── components/           # React components
│   ├── VerificationForm.tsx    # Main form with validation
│   ├── ImageUpload.tsx         # Drag-and-drop upload
│   ├── ImagePreview.tsx        # Image preview display
│   ├── FieldError.tsx          # Error message component
│   └── VerificationResults.tsx # Success page results
├── pages/               # Next.js pages
│   ├── index.tsx               # Main form page
│   ├── success.tsx             # Success results page
│   ├── _app.tsx                # App wrapper
│   └── api/
│       └── verify.ts           # Verification API endpoint
├── lib/                 # Utility functions
│   ├── visionExtraction.ts     # Claude Vision API integration
│   ├── ocr.ts                  # Legacy Tesseract OCR (deprecated)
│   ├── textMatching.ts         # Legacy fuzzy matching (deprecated)
│   └── verification.ts         # Legacy verification logic (deprecated)
├── types/               # TypeScript definitions
│   └── index.ts                # Type interfaces
├── styles/              # Global styles
│   └── globals.css             # Tailwind CSS imports
├── test-images/         # Test label images
│   └── README.md               # Testing guide
└── docs/                # Documentation
    ├── assignment.md           # Original assignment
    ├── DESIGN.md               # Design decisions
    └── EXECUTION_PLAN.md       # Implementation plan
```

## 🔍 How It Works

### 1. Smart Dual-Method Processing
```typescript
// pages/api/verify.ts
Primary Method: Claude Vision API
├─ Attempts Claude 3.5 Haiku Vision API first
├─ Extracts all fields in one intelligent analysis
└─ Returns structured JSON data

Fallback Method: Tesseract OCR
├─ Activates if Vision API fails (API key missing, rate limit, etc.)
├─ Extracts text using traditional OCR
├─ Uses regex patterns and fuzzy matching
└─ Ensures service remains available
```

### 2. Vision-Based Label Analysis (Primary)
```typescript
// lib/visionExtraction.ts
- Claude Vision API analyzes the uploaded label image
- Understands document structure and context
- Extracts all required fields in a single API call
- Returns structured JSON with brand, type, ABV, volume, and warning status
- Handles small text, unusual fonts, and complex layouts
```

### 3. OCR-Based Analysis (Fallback)
```typescript
// lib/ocr.ts + lib/verification.ts
- Tesseract.js extracts raw text from image
- Regex patterns locate specific information
- Fuzzy matching (80% threshold) compares form data to extracted text
- Works offline without API dependencies
```

### 4. Field Verification
```typescript
- Brand Name: Direct/fuzzy comparison with extracted data
- Product Type: Context-aware matching
- Alcohol Content: Numerical comparison (±0.5% tolerance)
- Net Contents: Volume comparison with unit normalization
- Government Warning: Boolean presence check / phrase search
```

## 🎯 Key Design Decisions

### Vision API as Primary with OCR Fallback

**Architecture**: Claude Vision API → Tesseract OCR (if Vision fails)

#### Pros of Vision API (Primary):
✅ **Superior Accuracy**:
   - Successfully extracts fields that OCR completely misses (e.g., "750 ML" in small print)
   - Understands document context and layout
   - Handles unusual fonts, small text, and complex backgrounds

✅ **Simpler Code**:
   - Returns structured JSON in one API call
   - No need for complex regex patterns or text parsing
   - Eliminates fuzzy matching complexity

✅ **Faster Processing**:
   - ~1-2 seconds vs 3-5 seconds for Tesseract
   - Single API call vs multiple processing steps

✅ **Better UX**:
   - Higher success rate means fewer user retries
   - More accurate field matching

#### Cons of Vision API:
❌ **Cost**:
   - $1 per million input tokens (Claude 3.5 Haiku)
   - ~$0.001-0.003 per image (vs free Tesseract)

❌ **External Dependency**:
   - Requires internet connectivity
   - Dependent on Anthropic API availability
   - Subject to rate limits

❌ **API Key Required**:
   - Setup complexity for deployment
   - Potential security considerations

#### Why OCR as Fallback:
- **Resilience**: System remains functional if Vision API is down
- **Zero Cost Baseline**: OCR provides free processing when needed
- **No API Key Required**: Works immediately for users without Anthropic account
- **Offline Capable**: Can process labels without internet (if API fails)

### Fallback Strategy Benefits
- **Graceful Degradation**: Never fully breaks, always attempts processing
- **Cost Control**: Falls back to free OCR if API budget is exhausted
- **Reliability**: Multiple paths to success increase overall system uptime

### Error Handling
- **UX**: Show all errors, not just first one
- **Details**: Specific messages with expected vs found values
- **Recovery**: Users can edit and resubmit without re-uploading image

## 📊 API Documentation

### POST `/api/verify`

Verifies an alcohol label image against submitted form data.

**Request**:
```
Content-Type: multipart/form-data

Fields:
- image: File (JPEG, PNG, or WebP)
- brandName: string
- productType: string
- alcoholContent: string (numeric)
- netContents: string
```

**Response** (200 OK):
```json
{
  "success": true,
  "fields": {
    "brandName": {
      "matched": true,
      "expected": "Old Tom Distillery",
      "found": "Old Tom Distillery",
      "similarity": 100
    },
    "productType": { /* ... */ },
    "alcoholContent": { /* ... */ },
    "netContents": { /* ... */ },
    "governmentWarning": { /* ... */ }
  }
}
```

**Error Response** (400/500):
```json
{
  "success": false,
  "fields": { /* field results */ },
  "error": "Error message"
}
```

## 🧪 Testing

### Manual Testing

1. **Perfect Match Test**
   - Use a clear label image with all required text
   - Fill form with exact values from label
   - Expected: Success page with all fields verified

2. **Mismatch Test**
   - Use different brand name in form vs label
   - Expected: Error highlighting brand name field

3. **Missing Warning Test**
   - Use label without "GOVERNMENT WARNING" text
   - Expected: Error about missing warning

4. **Low Quality Image Test**
   - Use blurry or low-resolution image
   - Expected: "Could not read text from image" error

### Test Image Requirements

See [`test-images/README.md`](./test-images/README.md) for detailed instructions on creating test images.

## 🚢 Deployment

### Deploy to Vercel

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

   Or push to GitHub and connect to Vercel dashboard for automatic deployments.

3. **Environment Variables**:
   - Set `ANTHROPIC_API_KEY` in Vercel dashboard (Settings → Environment Variables)
   - Required for Claude Vision API access

### Production Considerations

- **Processing Time**:
  - Vision API: 1-2 seconds per image
  - OCR Fallback: 3-5 seconds per image
- **API Costs** (Vision API):
  - Claude 3.5 Haiku: $1 per million input tokens
  - Estimated: $0.001-0.003 per label image
  - Budget ~300-1000 verifications per dollar
- **OCR Fallback**: Free, no ongoing costs
- **Rate Limiting**: Subject to Anthropic API rate limits (falls back to OCR)
- **Image Size**: Enforced 10MB limit to prevent abuse
- **Reliability**: Automatic fallback ensures >99% availability

## ⚠️ Known Limitations

1. **Vision API (Primary Method)**
   - Requires valid Anthropic API key for best accuracy
   - Subject to API rate limits and pricing
   - Needs internet connectivity
   - Falls back to OCR if unavailable

2. **OCR (Fallback Method)**
   - Lower accuracy than Vision API (may miss small text)
   - Slower processing (3-5 seconds vs 1-2 seconds)
   - May require higher quality images

3. **Processing Time**
   - No real-time progress indicator beyond loading spinner
   - Users don't see which method is being used

4. **Stateless Operation**
   - No history or saved verifications
   - Each verification is independent
   - No caching of previous results

## 🔮 Future Enhancements

### Short-term
- [ ] Add progress bar for API processing
- [ ] Support for multiple product types with different rules
- [ ] Caching for repeated verifications of same image

### Medium-term
- [ ] Save verification history (requires database)
- [ ] Export results as PDF report
- [ ] Batch processing for multiple labels

### Long-term
- [ ] Machine learning model for label classification
- [ ] Advanced compliance checks (sulfite declarations, wine appellations)
- [ ] Integration with actual TTB database
- [ ] Mobile app version

## 📝 Development Approach

### Implementation Timeline
This project was developed following a structured approach:

1. **Planning** (1 hour)
   - Reviewed requirements
   - Designed architecture
   - Created execution plan

2. **Backend Development** (2 hours)
   - OCR integration
   - Text matching logic
   - API endpoint

3. **Frontend Development** (2 hours)
   - React components
   - Form handling
   - Image upload

4. **Testing & Refinement** (1.5 hours)
   - Manual testing
   - Bug fixes
   - UI polish

5. **Documentation** (1 hour)
   - README
   - Code comments
   - Design docs

**Total Development Time**: ~7.5 hours

### Technology Choices Rationale

- **Next.js**: Full-stack framework reduces complexity, built-in API routes
- **Claude Vision API (Primary)**:
  - Superior accuracy over traditional OCR
  - Understands document context and handles complex layouts
  - Worth the cost for better user experience
- **Tesseract OCR (Fallback)**:
  - Free and reliable baseline
  - Ensures system works without API key
  - Good enough for clear, high-quality labels
- **Dual-Method Approach**: Best of both worlds - accuracy when possible, reliability always
- **React Hook Form**: Robust form validation with minimal code
- **Tailwind CSS**: Rapid UI development with consistent design

## 📄 License

This project was created as a take-home assignment for demonstrating full-stack development skills.

## 🙋 Support

For questions or issues:
- Check the documentation in `/docs`
- Review test image requirements in `/test-images/README.md`
- Examine code comments for implementation details

## 👏 Acknowledgments

- TTB (Alcohol and Tobacco Tax and Trade Bureau) for regulatory framework
- Tesseract OCR project for open-source OCR engine
- Next.js team for excellent framework and documentation
