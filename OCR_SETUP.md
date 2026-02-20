# Invoice OCR Auto-Extraction Setup

## Installation

### Backend
Navigate to the server directory and install the new dependency:

```bash
cd server
npm install
```

This will install `tesseract.js@^5.0.4` which is required for OCR functionality.

## How It Works

### Backend Flow
1. **OCR Service** (`services/ocrService.js`):
   - Extracts text from PDF/JPG/PNG invoices using Tesseract.js
   - Parses extracted text to identify:
     - Product Name
     - Purchase Date (multiple formats supported)
     - Order/Invoice ID
     - Amount/Price

2. **API Endpoint** (`POST /api/products/:id/extract-invoice`):
   - Requires authentication
   - Validates product ownership
   - Processes invoice file with OCR
   - Returns structured extracted data

### Frontend Flow
1. **Edit Product Page** (`/products/:id/edit`):
   - Shows "Auto Fill from Invoice" button (purple gradient)
   - Available only if product has an uploaded invoice

2. **OCR Extraction Process**:
   - Click "Auto Fill from Invoice"
   - Backend processes invoice with Tesseract
   - Modal displays extracted data for review
   - User can edit fields before applying
   - Click "Apply to Form" to auto-fill (only fills empty fields)

### Supported Formats
- **Documents**: PDF, JPG, JPEG, PNG
- **Date Formats**: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, "DD Month YYYY"
- **Currencies**: $, ₹, €, £

## Usage

1. **Upload Invoice** to a product (on product detail page)
2. **Navigate to Edit Page** (click "Edit" button)
3. **Click "Auto Fill from Invoice"** button
4. **Review Extracted Data** in the modal
5. **Edit if Needed** - OCR may not be 100% accurate
6. **Apply to Form** - Only empty fields are auto-filled
7. **Save Product** with the updated information

## Safety Features
- ✅ No auto-save without user confirmation
- ✅ Only fills empty form fields (doesn't overwrite existing data)
- ✅ User can review and edit before applying
- ✅ Graceful error handling with helpful messages
- ✅ Non-blocking UI with loading indicators

## Technical Details

### OCR Accuracy
- Works best with clear, high-resolution images
- PDF first page is processed
- Text extracted with English language model
- Parsing uses regex patterns for common invoice formats

### Performance
- OCR processing may take 3-10 seconds depending on image size
- Progress indicator shown during extraction
- Asynchronous processing doesn't block UI

### Error Handling
- Shows friendly messages if extraction fails
- Suggests uploading clearer images
- Logs errors server-side for debugging

## Limitations
- OCR accuracy depends on invoice image quality
- Complex layouts may reduce accuracy
- Best results with standard invoice formats
- Non-English invoices not currently supported

## Future Enhancements
- Multi-language support
- PDF multi-page processing
- Machine learning for improved parsing
- Custom extraction rules per retailer
