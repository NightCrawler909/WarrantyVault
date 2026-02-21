"""
WarrantyVault AI Microservice
Production-grade OCR and structured extraction using PaddleOCR + Donut
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from paddleocr import PaddleOCR
from transformers import DonutProcessor, VisionEncoderDecoderModel
from PIL import Image
from pdf2image import convert_from_bytes
import io
import os
import logging
import torch
import re
from typing import Dict, Any, Optional

# ============================================================
# CONFIGURATION
# ============================================================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="WarrantyVault AI Service",
    description="OCR and structured extraction for invoices",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize PaddleOCR (English)
paddle_ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)

# Initialize Donut model for structured extraction (lazy load)
donut_processor = None
donut_model = None

# ============================================================
# HELPER FUNCTIONS
# ============================================================

def load_donut_model():
    """Lazy load Donut model to save memory"""
    global donut_processor, donut_model
    
    if donut_processor is None or donut_model is None:
        logger.info("Loading Donut model...")
        try:
            donut_processor = DonutProcessor.from_pretrained("naver-clova-ix/donut-base-finetuned-docvqa")
            donut_model = VisionEncoderDecoderModel.from_pretrained("naver-clova-ix/donut-base-finetuned-docvqa")
            
            # Use GPU if available
            if torch.cuda.is_available():
                donut_model.to("cuda")
                logger.info("Donut model loaded on GPU")
            else:
                logger.info("Donut model loaded on CPU")
        except Exception as e:
            logger.error(f"Failed to load Donut model: {e}")
            raise
    
    return donut_processor, donut_model


def convert_pdf_to_image(pdf_bytes: bytes) -> Image.Image:
    """Convert PDF to PIL Image (first page only)"""
    try:
        images = convert_from_bytes(pdf_bytes, dpi=300, first_page=1, last_page=1)
        return images[0] if images else None
    except Exception as e:
        logger.error(f"PDF conversion failed: {e}")
        raise


def extract_text_with_paddleocr(image: Image.Image) -> Dict[str, Any]:
    """
    Extract text from image using PaddleOCR
    Returns: {text, confidence}
    """
    try:
        # Convert PIL Image to format PaddleOCR expects
        img_array = image
        
        # Run OCR
        result = paddle_ocr.ocr(img_array, cls=True)
        
        if not result or not result[0]:
            return {"text": "", "confidence": 0.0}
        
        # Extract text and confidence scores
        extracted_lines = []
        confidence_scores = []
        
        for line in result[0]:
            text = line[1][0]  # Text content
            confidence = line[1][1]  # Confidence score
            extracted_lines.append(text)
            confidence_scores.append(confidence)
        
        full_text = "\n".join(extracted_lines)
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.0
        
        logger.info(f"Extracted {len(extracted_lines)} lines with avg confidence: {avg_confidence:.2f}")
        
        return {
            "text": full_text,
            "confidence": round(avg_confidence, 4)
        }
    
    except Exception as e:
        logger.error(f"PaddleOCR extraction failed: {e}")
        raise


def extract_structured_with_donut(image: Image.Image, target_field: str) -> str:
    """
    Extract specific field using Donut model
    """
    try:
        processor, model = load_donut_model()
        
        # Prepare prompt for field extraction
        prompt_map = {
            "product_name": "What is the product name?",
            "order_id": "What is the order ID?",
            "invoice_number": "What is the invoice number?",
            "total_amount": "What is the total amount?",
            "purchase_date": "What is the purchase date?",
            "retailer": "What is the retailer name?"
        }
        
        prompt = prompt_map.get(target_field, f"What is the {target_field}?")
        
        # Prepare input
        pixel_values = processor(image, return_tensors="pt").pixel_values
        
        if torch.cuda.is_available():
            pixel_values = pixel_values.to("cuda")
        
        # Generate answer
        decoder_input_ids = processor.tokenizer(
            f"<s_docvqa><s_question>{prompt}</s_question><s_answer>",
            add_special_tokens=False,
            return_tensors="pt"
        ).input_ids
        
        if torch.cuda.is_available():
            decoder_input_ids = decoder_input_ids.to("cuda")
        
        outputs = model.generate(
            pixel_values,
            decoder_input_ids=decoder_input_ids,
            max_length=model.decoder.config.max_position_embeddings,
            early_stopping=True,
            pad_token_id=processor.tokenizer.pad_token_id,
            eos_token_id=processor.tokenizer.eos_token_id,
            use_cache=True,
            num_beams=1,
            bad_words_ids=[[processor.tokenizer.unk_token_id]],
            return_dict_in_generate=True,
        )
        
        # Decode answer
        sequence = processor.batch_decode(outputs.sequences)[0]
        sequence = sequence.replace(processor.tokenizer.eos_token, "").replace(processor.tokenizer.pad_token, "")
        sequence = re.sub(r"<.*?>", "", sequence, count=1).strip()  # Remove <s_answer> tag
        
        return sequence
    
    except Exception as e:
        logger.error(f"Donut extraction failed for {target_field}: {e}")
        return ""


def extract_all_structured_fields(image: Image.Image) -> Dict[str, str]:
    """
    Extract all required fields using Donut model
    """
    fields = ["product_name", "order_id", "invoice_number", "total_amount", "purchase_date", "retailer"]
    results = {}
    
    for field in fields:
        try:
            value = extract_structured_with_donut(image, field)
            results[field] = value if value else ""
            logger.info(f"Donut extracted {field}: {value}")
        except Exception as e:
            logger.error(f"Failed to extract {field}: {e}")
            results[field] = ""
    
    return results


# ============================================================
# API ENDPOINTS
# ============================================================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "WarrantyVault AI Microservice",
        "version": "1.0.0",
        "models": {
            "ocr": "PaddleOCR",
            "structured": "Donut (naver-clova-ix/donut-base-finetuned-docvqa)"
        }
    }


@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    """
    Extract full text from uploaded invoice (PDF/JPG/PNG)
    
    Returns:
    {
        "text": "full extracted text",
        "confidence": average_confidence_score
    }
    """
    try:
        logger.info(f"Received file: {file.filename} ({file.content_type})")
        
        # Read file bytes
        file_bytes = await file.read()
        
        # Determine file type and convert to image
        if file.content_type == "application/pdf":
            logger.info("Converting PDF to image...")
            image = convert_pdf_to_image(file_bytes)
        else:
            # Assume image format (JPG/PNG)
            image = Image.open(io.BytesIO(file_bytes))
        
        if image is None:
            raise HTTPException(status_code=400, detail="Failed to process file")
        
        # Run OCR
        result = extract_text_with_paddleocr(image)
        
        return JSONResponse(content=result)
    
    except Exception as e:
        logger.error(f"Error in /extract-text: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ai-structured-extract")
async def ai_structured_extract(file: UploadFile = File(...)):
    """
    Extract structured invoice fields using AI (Donut model)
    Used as fallback when deterministic parsing fails.
    
    Returns:
    {
        "product_name": "...",
        "order_id": "...",
        "invoice_number": "...",
        "total_amount": "...",
        "purchase_date": "...",
        "retailer": "..."
    }
    """
    try:
        logger.info(f"AI structured extraction for: {file.filename}")
        
        # Read file bytes
        file_bytes = await file.read()
        
        # Convert to image
        if file.content_type == "application/pdf":
            image = convert_pdf_to_image(file_bytes)
        else:
            image = Image.open(io.BytesIO(file_bytes))
        
        if image is None:
            raise HTTPException(status_code=400, detail="Failed to process file")
        
        # Extract all structured fields using Donut
        structured_data = extract_all_structured_fields(image)
        
        return JSONResponse(content=structured_data)
    
    except Exception as e:
        logger.error(f"Error in /ai-structured-extract: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# STARTUP
# ============================================================

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
