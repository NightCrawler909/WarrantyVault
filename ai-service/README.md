# WarrantyVault AI Microservice

Production-grade OCR and structured extraction microservice using PaddleOCR + Donut.

## Features

- **Text Extraction**: PaddleOCR for high-accuracy text extraction
- **Structured Extraction**: Donut model for AI-powered field extraction
- **PDF Support**: Automatic PDF to image conversion
- **Fallback Architecture**: Used when deterministic parsing fails

## Installation

### Prerequisites

- Python 3.8+
- poppler-utils (for PDF conversion)

### Windows

```bash
# Install poppler
# Download from: https://github.com/oschwartz10612/poppler-windows/releases
# Add to PATH

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Linux/Mac

```bash
# Install poppler
sudo apt-get install poppler-utils  # Debian/Ubuntu
brew install poppler                # macOS

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Running the Service

```bash
# Activate virtual environment
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Start server
python app.py

# Or with uvicorn directly
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

The service will be available at: `http://localhost:8000`

## API Endpoints

### 1. Health Check

```
GET /
```

Returns service status and loaded models.

### 2. Extract Text (OCR)

```
POST /extract-text
Content-Type: multipart/form-data
```

**Input**: Uploaded file (PDF/JPG/PNG)

**Output**:
```json
{
  "text": "full extracted text from invoice",
  "confidence": 0.9523
}
```

### 3. AI Structured Extract

```
POST /ai-structured-extract
Content-Type: multipart/form-data
```

**Input**: Uploaded file (PDF/JPG/PNG)

**Output**:
```json
{
  "product_name": "Pigeon Favourite Electric Kettle",
  "order_id": "OD430543585270089100",
  "invoice_number": "FAFO7Z2401525755",
  "total_amount": "549",
  "purchase_date": "04-01-2024",
  "retailer": "Flipkart"
}
```

## Architecture

```
Node Backend (port 5000)
    ↓
    → Python AI Service (port 8000)
        ↓
        → PaddleOCR (text extraction)
        ↓
    ← Return text
    ↓
Deterministic Parser (Amazon/Flipkart)
    ↓
    → If validation fails:
        ↓
        → Python AI Service /ai-structured-extract
            ↓
            → Donut Model (structured fields)
            ↓
        ← Return structured data
```

## Performance

- **PaddleOCR**: ~2-3s per invoice
- **Donut Model**: ~5-8s per invoice (GPU), ~15-20s (CPU)
- **GPU Recommended**: For production use with high volume

## Notes

- Donut model is lazy-loaded to save memory
- First request to `/ai-structured-extract` will be slower (model loading)
- Use GPU for faster inference (CUDA required)
