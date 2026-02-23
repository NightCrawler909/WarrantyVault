# Invoice Processing Engine - Architecture Documentation

## Overview

The Invoice Processing Engine is a **modular, production-ready system** for extracting structured data from e-commerce invoices (Amazon, Flipkart). It replaces the previous monolithic architecture with a clean, maintainable design based on **separation of concerns**.

---

## Architecture Design

### 📐 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  invoiceProcessor.js                     │
│              (Main Orchestrator)                         │
└───────────┬─────────────────────────────────────────────┘
            │
            ├──► platformDetector.js (Platform Detection)
            │    └─► Strong signal-based detection
            │        • Amazon: amazon.in, order format, 2+ signals
            │        • Flipkart: flipkart, GSTIN, 2+ signals
            │        • Returns: 'amazon' | 'flipkart' | 'unknown'
            │
            ├──► pageClassifier.js (Page Scoring & Selection)
            │    └─► Robust scoring algorithm
            │        • Service penalties: -50 each
            │        • Product rewards: +20 to +40
            │        • Total modifiers: ±30-40
            │        • Selects highest scoring page
            │
            ├──► amazonExtractor.js (Amazon-specific extraction)
            │    └─► Extracts: orderId, productName, price, date, etc.
            │        • Uses priceExtractor for price
            │        • Pattern matching for Amazon formats
            │
            ├──► flipkartExtractor.js (Flipkart-specific extraction)
            │    └─► Extracts: orderId, productTitle, price, date, etc.
            │        • Uses priceExtractor for price
            │        • Pattern matching for Flipkart formats
            │
            └──► priceExtractor.js (Centralized Price Logic)
                 └─► Priority-based extraction
                     • Priority 1: Grand Total
                     • Priority 2: TOTAL
                     • Priority 3: Total Amount
                     • Always selects LARGEST amount
```

---

## 📂 Module Structure

### 1. **invoiceProcessor.js** (Main Orchestrator)

**Purpose**: Controls entire extraction pipeline

**Flow**:
1. Extract pages from PDF
2. Detect platform (Amazon/Flipkart/Unknown)
3. Classify pages & select best page (for multi-page PDFs)
4. Run platform-specific extraction
5. Calculate confidence score
6. Return structured JSON

**Key Methods**:
- `process(filePath)` - Main entry point
- `calculateConfidence(data, platformConfidence)` - Aggregates confidence
- `formatResult(data)` - Standardizes output format

**Output Format**:
```javascript
{
  platform: "amazon",
  productName: "...",
  orderId: "123-1234567-1234567",
  invoiceNumber: "...",
  invoiceDate: "2024-01-15",
  orderDate: "2024-01-15",
  price: 488,
  retailer: "...",
  vendor: "...",
  hsn: "85234910",
  confidenceScore: 85,
  extractionDetails: {}
}
```

---

### 2. **platformDetector.js** (Platform Detection)

**Purpose**: Detect invoice platform using strong signals

**Detection Logic**:
- **Amazon**: Requires 2+ signals
  - `amazon.in` domain
  - Order format: `123-1234567-1234567`
  - "Amazon Seller Services"
  
- **Flipkart**: Requires 2+ signals
  - `flipkart` keyword
  - GSTIN: `27AAICA...`
  - Order format: `OD123456789012`
  - "Tech-Connect Retail"

**Key Methods**:
- `detect(text)` → `'amazon' | 'flipkart' | 'unknown'`
- `getConfidence(text, platform)` → confidence % (0-100)

---

### 3. **pageClassifier.js** (Page Scoring & Selection)

**Purpose**: Score and select best page from multi-page PDFs

**Scoring Algorithm**:
```
NEGATIVE INDICATORS (Service/COD pages):
- "Service Accounting Code" → -50
- "COD" / "Cash on Delivery" → -50
- "small amount" words → -50
- Total < ₹50 → -30

POSITIVE INDICATORS (Product pages):
- HSN code (8 digits) → +20
- "Unit Price" column → +20
- "Qty" / "Quantity" → +20
- Product description (50+ chars) → +30
- ASIN code → +30
- Total > ₹100 → +40
```

**Key Methods**:
- `classifyPages(pages)` - Classify all pages
- `classifyPage(text)` - Score single page
- `extractMaxTotal(text)` - Find largest total
- `selectBestPage(classifiedPages)` - Select highest scoring page

**Example Output**:
```
PAGE SCORES DEBUG:
  Page 1: -230 points | Total: ₹7 | Type: service
  Page 2: +160 points | Total: ₹488 | Type: product ✓ SELECTED
```

---

### 4. **priceExtractor.js** (Centralized Price Logic)

**Purpose**: Extract price with priority-based logic

**Priority System**:
1. **Grand Total** (most reliable for invoices)
2. **TOTAL** (common label)
3. **Total Amount** (alternative label)
4. **Final/Net Amount** (fallback)

**Selection Rule**: Always select **LARGEST** amount collected

**Key Methods**:
- `extract(text, platform)` - Main extraction
- `parseAmount(amountStr)` - Parse ₹1,234.56 → 1234.56
- `extractFallback(text)` - When no labeled totals found
- `validate(price, platform)` - Range validation

**Validation**:
- E-commerce range: ₹10 - ₹500,000
- Rejects invalid amounts (< 0, > 1M)

**Example Logging**:
```
[Price] Found TOTAL #1: ₹488.00
[Price] Found TOTAL #2: ₹7.00
[Price] ✅ Selected LARGEST: ₹488
```

---

### 5. **amazonExtractor.js** (Amazon-specific Extraction)

**Purpose**: Extract Amazon invoice fields

**Extracted Fields**:
- `orderId` - Pattern: `123-1234567-1234567`
- `invoiceNumber` - Alpha-numeric
- `orderDate` / `invoiceDate` - DD.MM.YYYY → YYYY-MM-DD
- `productName` - From description column, 10-200 chars
- `price` - Uses priceExtractor
- `vendor` - "Sold By:" pattern
- `hsn` - HSN code (4-10 digits)

**Key Methods**:
- `extract(text)` - Main extraction
- `extractOrderNumber(text)`
- `extractProductName(text)`
- `extractVendor(text)`
- `extractHSN(text)`
- `normalizeDate(dateStr)` - Convert to YYYY-MM-DD

---

### 6. **flipkartExtractor.js** (Flipkart-specific Extraction)

**Purpose**: Extract Flipkart invoice fields

**Extracted Fields**:
- `orderId` - Pattern: `OD123456789012`
- `invoiceNumber` - Alpha-numeric
- `orderDate` / `invoiceDate` - DD.MM.YYYY → YYYY-MM-DD
- `productName` - From "Title:" or first row
- `price` - Uses priceExtractor
- `retailer` - "Sold By:" or "Retailer:" pattern
- `hsn` - HSN/SAC code

**Key Methods**:
- `extract(text)` - Main extraction
- `extractOrderId(text)`
- `extractProductTitle(text)`
- `extractRetailer(text)`
- `extractHSN(text)`
- `normalizeDate(dateStr)` - Convert to YYYY-MM-DD

---

## 🔄 Integration with Existing System

### Modified Files

**server/services/ocrService.js**:
- Added `require('./invoiceProcessor')`
- Modified `processInvoice(filePath)` to use new modular engine
- Added `convertToLegacyFormat()` for backward compatibility
- Maintained AI fallback logic (confidence < 60%)

**Integration Flow**:
```
productController.js
  └─► ocrService.processInvoice()
       └─► invoiceProcessor.process() [NEW]
            └─► [Platform Detection → Page Classification → Extraction]
       └─► AI Fallback (if confidence < 60%)
       └─► Return legacy format
```

---

## 🎯 Confidence Scoring

### Scoring System

**Field Scoring** (+20 points each):
- Product Name: ≥10 chars → +20
- Order ID: ≥5 chars, valid format → +20
- Price: ≥₹10 → +20
- Invoice Date: valid date → +20
- Retailer: ≥3 chars → +20
- HSN: ≥4 digits → +20

**Platform Confidence Bonus**:
- Up to 10% bonus based on platform detection confidence

**Max Score**: 100 (capped)

**AI Fallback Trigger**: Confidence < 60%

---

## 🧪 Testing

### Test Scripts

**test-invoice-processor.js**:
- End-to-end test for complete pipeline
- Validates all extracted fields
- Checks confidence score
- Reports pass/fail for each field

**Usage**:
```bash
node server/test-invoice-processor.js
```

**Expected Output**:
```
📄 INVOICE PROCESSING PIPELINE
============================================

STEP 1: Extracting pages from PDF...
✅ Extracted 2 page(s)

STEP 2: Detecting platform...
✅ Platform: AMAZON (confidence: 95%)

STEP 3: Classifying pages...
PAGE SCORES DEBUG:
  Page 1: -230 points | Total: ₹7 | Type: service
  Page 2: +160 points | Total: ₹488 | Type: product ✓ SELECTED

STEP 4: Running platform-specific extraction...
[Amazon] Order Number: 123-1234567-1234567
[Amazon] Product Name: Xiaomi Redmi Note...
[Price] ✅ Selected LARGEST: ₹488

STEP 5: Calculating confidence score...
✅ Overall confidence: 85%

============================================
✅ INVOICE PROCESSING COMPLETE
============================================
```

---

## 🐛 Debugging

### Debug Logging

Each module includes detailed console logging:

**Platform Detection**:
```
[Platform] Checking Amazon signals...
[Platform] ✓ Found: amazon.in
[Platform] ✓ Found: order format (123-1234567-1234567)
[Platform] 🎯 AMAZON detected (2 of 3 signals)
```

**Page Classification**:
```
[PageClassifier] Classifying 2 page(s)...
[PageClassifier] Page 1: -230 points (service page)
[PageClassifier] Page 2: +160 points (product page)
[PageClassifier] ✅ Selected Page 2 (best score)
```

**Price Extraction**:
```
[Price] Extracting from AMAZON invoice...
[Price] Found TOTAL #1: ₹488.00
[Price] Found TOTAL #2: ₹7.00
[Price] ✅ Selected LARGEST: ₹488
```

**Field Extraction**:
```
[Amazon] Starting extraction...
[Amazon] Order Number: 123-1234567-1234567
[Amazon] Product Name: Xiaomi Redmi Note...
[Amazon] Price: ₹488
[Amazon] Vendor: Appario Retail Private Ltd
```

---

## 🔧 Maintenance

### Adding a New Platform

**Example: Adding Myntra Support**

1. **Create `myntraExtractor.js`**:
```javascript
const priceExtractor = require('./priceExtractor');

class MyntraExtractor {
  extract(text) {
    // Implement Myntra-specific extraction
    const data = {
      platform: 'myntra',
      productName: this.extractProductName(text),
      orderId: this.extractOrderId(text),
      price: priceExtractor.extract(text, 'myntra'),
      // ... other fields
    };
    return data;
  }
}

module.exports = new MyntraExtractor();
```

2. **Update `platformDetector.js`**:
```javascript
// Add Myntra signals
const myntraSignals = [
  /myntra/i,
  /order id:\s*MYN\d+/i
];
```

3. **Update `invoiceProcessor.js`**:
```javascript
const myntraExtractor = require('./myntraExtractor');

// In process() method:
if (detectedPlatform === 'myntra') {
  extractedData = myntraExtractor.extract(selectedText);
}
```

---

## 📊 Performance

### Benchmarks

- **Single-page PDF**: ~0.5-1 second
- **Multi-page PDF (2-3 pages)**: ~1-2 seconds
- **Platform detection**: <100ms
- **Page classification**: ~200ms per page
- **Field extraction**: ~300-500ms

### Optimization Tips

1. **Caching**: Platform detection signals compiled once at initialization
2. **Lazy evaluation**: Only classify pages for multi-page PDFs
3. **Early exit**: Stop searching once required fields found
4. **Regex optimization**: Pre-compiled patterns for better performance

---

## 🚨 Error Handling

### Error Types

**PDF Extraction Errors**:
- Empty PDF or no text content
- Corrupted PDF file
- Password-protected PDF

**Platform Detection Errors**:
- Unknown platform (< 2 signals matched)
- Ambiguous platform (multiple platforms detected)

**Extraction Errors**:
- Missing required fields
- Invalid field formats
- Price validation failures

### Fallback Strategy

1. **Primary**: Modular extraction (new engine)
2. **Fallback**: AI extraction (if confidence < 60%)
3. **Last Resort**: Return partial data with low confidence

---

## 📝 Best Practices

### When to Use AI Fallback

- Confidence score < 60%
- Critical fields missing (orderId, price, productName)
- Unusual invoice format

### When to Manually Review

- Confidence score < 40%
- Platform = 'unknown'
- Price validation failed
- Multiple extraction attempts failed

---

## 🎓 Lessons Learned

### Design Principles Applied

1. **Separation of Concerns**: Each module = single responsibility
2. **Dependency Injection**: Services don't know about each other
3. **Open/Closed Principle**: Easy to add new platforms without modifying core
4. **Debuggability**: Detailed logging at each step
5. **Testability**: Each module can be tested independently

### Previous Issues Resolved

✅ **Amazon Multi-Page Bug**: Service page (₹7) selected instead of product page (₹488)
- **Solution**: Robust page scoring with service penalties

✅ **Scattered Regex**: Platform-specific patterns mixed everywhere
- **Solution**: Isolated extractors with centralized price logic

✅ **Hard to Debug**: Single monolithic function
- **Solution**: Modular pipeline with step-by-step logging

✅ **No Confidence Metrics**: Blind trust in extraction
- **Solution**: Field-level validation with confidence scoring

---

## 📚 Related Documentation

- **AMAZON_MULTIPAGE_FIX.md** - Amazon multi-page processing history
- **test-invoice-processor.js** - End-to-end testing
- **test-robust-scoring.js** - Page classification testing

---

## 🤝 Contributing

### Code Style

- **Logging**: Use descriptive prefixes (`[Platform]`, `[Price]`, `[Amazon]`)
- **Naming**: Clear, descriptive function names (`extractOrderNumber` not `extract1`)
- **Comments**: Explain WHY, not WHAT
- **Error Messages**: Include context and suggestions

### Pull Request Checklist

- [ ] Added unit tests for new functionality
- [ ] Updated this ARCHITECTURE.md
- [ ] Verified confidence scoring
- [ ] Tested with real invoices (Amazon + Flipkart)
- [ ] No regression in existing tests

---

**Last Updated**: 2024
**Version**: 2.0.0 (Modular Engine)
