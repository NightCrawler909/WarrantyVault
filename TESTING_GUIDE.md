# WarrantyVault Hybrid AI - Testing Guide

## Testing Checklist

### Phase 1: Installation & Setup ✓

- [ ] Run `setup.bat` (Windows) or `./setup.sh` (Linux/Mac)
- [ ] Verify Node dependencies installed in `server/node_modules`
- [ ] Verify Python venv created in `ai-service/venv`
- [ ] Install poppler (check with `pdftoppm -v`)
- [ ] Configure `server/.env` with `PYTHON_AI_SERVICE_URL=http://localhost:8000`

### Phase 2: Service Startup ✓

- [ ] Start Python AI service: `python ai-service/app.py`
- [ ] Verify Python service: visit `http://localhost:8000`
- [ ] Start Node backend: `npm run dev` in `server/`
- [ ] Verify Node backend: visit `http://localhost:5000`
- [ ] Start React frontend: `npm run dev` in `client/`
- [ ] Verify React frontend: visit `http://localhost:3000`

### Phase 3: OCR Engine Tests 🧪

#### Test 1: Python AI Service (PaddleOCR)

**Objective**: Verify PaddleOCR extraction works

**Steps**:
1. Upload any invoice (Amazon/Flipkart JPG or PDF)
2. Check server console logs
3. Look for: `🐍 Using Python AI Service (PaddleOCR)...`
4. Look for: `✅ PaddleOCR completed - Confidence: XX.X%`

**Expected Result**:
- Text extracted successfully
- Confidence score > 80%
- Method: `paddleocr`

**Failure Scenario**:
- If Python service down, should fallback to Tesseract
- Look for: `⚠️ Python AI service unavailable - falling back to Tesseract.js`

#### Test 2: Tesseract Fallback

**Objective**: Verify Tesseract fallback when Python unavailable

**Steps**:
1. Stop Python AI service (Ctrl+C)
2. Upload invoice
3. Check server console logs
4. Look for: `⚠️ Python AI service unavailable - falling back to Tesseract.js`

**Expected Result**:
- Text still extracted (slower)
- Method: `tesseract`
- Confidence score may be lower

### Phase 4: Platform Detection Tests 🎯

#### Test 3: Amazon Invoice Detection

**Test File**: Amazon PDF/JPG

**Expected Detection**:
```
🎯 Detected Platform: AMAZON

[Amazon Order Number] Found: 171-4078830-4755561
[Amazon Invoice] Found: FBOI-61720
[Amazon Vendor] Sold By: RETAILEZ PRIVATE LIMITED
[Amazon Product] Description: Bajaj 1200 mm Frore NEO Ceiling Fan
[Amazon Price] TOTAL: ₹1399
```

**Expected Response**:
```json
{
  "platform": "amazon",
  "detectedOrderId": "171-4078830-4755561",
  "detectedInvoiceNumber": "FBOI-61720",
  "detectedProductName": "Bajaj 1200 mm Frore NEO Ceiling Fan",
  "detectedAmount": "1399",
  "detectedRetailer": "RETAILEZ PRIVATE LIMITED",
  "detectedPurchaseDate": "2024-01-15",
  "extractionMethod": "deterministic",
  "ocrConfidence": 0.95
}
```

**Validation**:
- [ ] Platform = "amazon"
- [ ] Order ID format: `XXX-XXXXXXX-XXXXXXX`
- [ ] Product name >= 5 characters
- [ ] Price >= 10
- [ ] extractionMethod = "deterministic"

#### Test 4: Flipkart Invoice Detection

**Test File**: Flipkart PDF/JPG

**Expected Detection**:
```
🎯 Detected Platform: FLIPKART

[Flipkart Order ID] Found: OD430543585270089100
[Flipkart Invoice] Found: FAFO7Z2401525755
[Flipkart Vendor] Sold By: Tech-Connect Retail Private Limited
[Flipkart Product] Candidate: Pigeon Favourite Electric Kettle
[Flipkart Product] ✓ Validated: Pigeon Favourite Electric Kettle
[Flipkart Price] Grand Total: ₹549
```

**Expected Response**:
```json
{
  "platform": "flipkart",
  "detectedOrderId": "OD430543585270089100",
  "detectedInvoiceNumber": "FAFO7Z2401525755",
  "detectedProductName": "Pigeon Favourite Electric Kettle",
  "detectedAmount": "549",
  "detectedRetailer": "Tech-Connect Retail Private Limited",
  "detectedPurchaseDate": "2024-01-04",
  "detectedHSN": "85167100",
  "detectedFSN": "EKTGFNX8GHHZKNCE",
  "extractionMethod": "deterministic",
  "ocrConfidence": 0.92
}
```

**Validation**:
- [ ] Platform = "flipkart"
- [ ] Order ID = `OD` + 18 digits (exactly 20 chars)
- [ ] Product NOT table headers ("Amount ₹", "UTGST", etc.)
- [ ] Price >= 10
- [ ] extractionMethod = "deterministic"

#### Test 5: Generic Invoice Detection

**Test File**: Non-Amazon/Flipkart invoice

**Expected Detection**:
```
🎯 Detected Platform: GENERIC

[Generic] Using generic extraction patterns...
```

**Expected Response**:
```json
{
  "platform": "generic",
  "detectedProductName": "...",
  "detectedAmount": "...",
  "extractionMethod": "deterministic"
}
```

### Phase 5: AI Fallback Tests 🤖

#### Test 6: Trigger AI Fallback (Invalid Product)

**Objective**: Force AI fallback by providing poor quality invoice

**Simulation**:
1. Use heavily degraded/blurry invoice image
2. OR manually edit OCR to inject bad data

**Expected Behavior**:
```
⚠️ Validation failed - falling back to generic extraction...
⚠️ Generic extraction also has issues - returning best effort

🤖 TRIGGERING AI FALLBACK - Deterministic parsing insufficient
   Reason: Product name too short or missing, Price invalid or missing

   Calling Python AI service for structured extraction...

🤖 AI structured extraction for: invoice.jpg
✅ AI structured extraction completed

   [AI Override] Product: Pigeon Favourite Electric Kettle
   [AI Override] Order ID: OD430543585270089100
   [AI Override] Amount: ₹549

✅ AI Fallback completed - using enhanced data
```

**Expected Response**:
```json
{
  "extractionMethod": "ai_fallback",
  "detectedProductName": "Pigeon Favourite Electric Kettle",
  "detectedOrderId": "OD430543585270089100",
  "detectedAmount": "549"
}
```

**Validation**:
- [ ] extractionMethod = "ai_fallback"
- [ ] Product name extracted by Donut model
- [ ] Order ID extracted by Donut model
- [ ] Console shows `[AI Override]` messages

#### Test 7: AI Fallback - Python Service Down

**Objective**: Verify graceful handling when AI unavailable

**Steps**:
1. Stop Python AI service
2. Upload poor quality invoice (would normally trigger AI)

**Expected Behavior**:
```
🤖 TRIGGERING AI FALLBACK - Deterministic parsing insufficient
⚠️  Python AI service unavailable - using deterministic results
```

**Expected Response**:
- Returns best effort from deterministic parsing
- extractionMethod = "deterministic" (not "ai_fallback")
- No 500 error

### Phase 6: Edge Cases 🔬

#### Test 8: Flipkart Product Name (Table Header Bug)

**Objective**: Ensure Flipkart JPG extracts product, not headers

**Test File**: Flipkart invoice with product table

**BAD Output (Old Bug)**:
```
detectedProductName: "Amount ₹ /Coupons₹ Value ₹ ₹ UTGST"
```

**GOOD Output (Fixed)**:
```
detectedProductName: "Pigeon Favourite Electric Kettle"
```

**Console Logs Should Show**:
```
[Flipkart Product] Isolated table section
[Flipkart Product] Skipping table header: "Amount ₹ /Coupons₹..."
[Flipkart Product] Candidate found: "Pigeon Favourite Electric Kettle"
[Flipkart Product] ✓ Validated: "Pigeon Favourite Electric Kettle"
```

**Validation**:
- [ ] Product name is actual product, NOT table headers
- [ ] No currency symbols (₹) in product name
- [ ] No tax terms (CGST, SGST, UTGST) in product name
- [ ] Product name >= 10 characters

#### Test 9: PDF with Embedded Text

**Objective**: Verify smart PDF processing uses embedded text

**Test File**: Digital PDF (not scanned)

**Expected Behavior**:
```
✅ PDF detected - using smart processing pipeline...
✅ Using embedded PDF text (no OCR required)
```

**Expected Response**:
- extractionMethod should include embedded_pdf in metadata
- Very fast processing (<1 second)
- High confidence score (1.0)

#### Test 10: Scanned PDF (Requires OCR)

**Objective**: Verify scanned PDFs trigger OCR

**Test File**: Scanned PDF invoice

**Expected Behavior**:
```
✅ PDF detected - using smart processing pipeline...
⚠️  PDF requires OCR - using converted image
🐍 Using Python AI Service (PaddleOCR)...
```

**Expected Response**:
- PDF converted to 400 DPI PNG
- PaddleOCR runs on image
- Confidence score < 1.0

### Phase 7: Performance Tests ⚡

#### Test 11: Processing Speed

**Measure**:
- Amazon PDF: _________ seconds
- Amazon JPG: _________ seconds
- Flipkart PDF: _________ seconds
- Flipkart JPG: _________ seconds
- Generic invoice: _________ seconds

**Expected**:
- PaddleOCR: 2-3 seconds
- Tesseract: 3-5 seconds
- AI Fallback (GPU): 5-8 seconds
- AI Fallback (CPU): 15-20 seconds

#### Test 12: Accuracy Comparison

| Platform | File Type | Deterministic | AI Fallback |
|----------|-----------|---------------|-------------|
| Amazon   | PDF       | ____%         | ____%       |
| Amazon   | JPG       | ____%         | ____%       |
| Flipkart | PDF       | ____%         | ____%       |
| Flipkart | JPG       | ____%         | ____%       |
| Generic  | PDF       | ____%         | ____%       |

**Target**: 95%+ for Amazon/Flipkart, 85%+ for Generic

### Phase 8: Error Handling 🛡️

#### Test 13: Invalid File Type

**Upload**: `.txt` or `.docx` file

**Expected Response**:
```json
{
  "success": false,
  "error": "Unsupported file format: .txt. Please upload JPG, PNG, or PDF files."
}
```

#### Test 14: Corrupted File

**Upload**: Corrupted/incomplete PDF

**Expected Response**:
```json
{
  "success": false,
  "error": "Failed to extract text from invoice: ..."
}
```

#### Test 15: Very Large File

**Upload**: 10MB+ invoice

**Expected Behavior**:
- Should process (if within limits)
- OR return size limit error

### Test Results Summary

**Date**: _____________
**Tester**: _____________

| Test # | Test Name                  | Status | Notes |
|--------|----------------------------|--------|-------|
| 1      | PaddleOCR Extraction       | [ ]    |       |
| 2      | Tesseract Fallback         | [ ]    |       |
| 3      | Amazon Detection           | [ ]    |       |
| 4      | Flipkart Detection         | [ ]    |       |
| 5      | Generic Detection          | [ ]    |       |
| 6      | AI Fallback Trigger        | [ ]    |       |
| 7      | AI Service Down            | [ ]    |       |
| 8      | Flipkart Product Name      | [ ]    |       |
| 9      | Embedded PDF Text          | [ ]    |       |
| 10     | Scanned PDF OCR            | [ ]    |       |
| 11     | Processing Speed           | [ ]    |       |
| 12     | Accuracy Comparison        | [ ]    |       |
| 13     | Invalid File Type          | [ ]    |       |
| 14     | Corrupted File             | [ ]    |       |
| 15     | Large File Handling        | [ ]    |       |

**Overall Result**: ______ / 15 Passed

## Quick Test Commands

### Check Python Service Health
```bash
curl http://localhost:8000
```

### Test OCR Extraction (Python Service)
```bash
curl -X POST http://localhost:8000/extract-text \
  -F "file=@path/to/invoice.pdf"
```

### Test AI Structured Extraction
```bash
curl -X POST http://localhost:8000/ai-structured-extract \
  -F "file=@path/to/invoice.pdf"
```

### Test Full Node API (requires auth token)
```bash
curl -X POST http://localhost:5000/api/products/extract-temp-invoice \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "invoice=@path/to/invoice.pdf"
```

## Debugging Tips

### Enable Verbose Logging

**Node Backend**:
Set `LOG_LEVEL=debug` in `server/.env`

**Python Service**:
Set `LOG_LEVEL=DEBUG` in `ai-service/.env`

### Check OCR Quality

Look for confidence scores in logs:
- `>90%` = Excellent
- `80-90%` = Good
- `60-80%` = Acceptable (may have errors)
- `<60%` = Poor (many errors likely)

### Common Issues

**"Python AI service not running"**
→ Start Python service: `python ai-service/app.py`

**"Cannot find module 'axios'"**
→ Install: `cd server && npm install axios form-data`

**"ModuleNotFoundError: No module named 'paddleocr'"**
→ Install: `cd ai-service && source venv/bin/activate && pip install -r requirements.txt`

**Donut model slow on first run**
→ First run downloads model (~2GB), subsequent runs are faster

**Low PaddleOCR confidence**
→ Check image quality, resolution should be >300 DPI
