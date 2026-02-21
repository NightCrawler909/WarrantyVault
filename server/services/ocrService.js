const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');
const pdfService = require('./pdfService');

class OCRService {
  /**
   * Detect actual file type by reading magic bytes
   * @param {string} filePath - Path to file
   * @returns {string} Actual file type ('pdf', 'jpg', 'png', 'unknown')
   */
  detectFileType(filePath) {
    try {
      const buffer = fs.readFileSync(filePath);
      
      // Check PDF signature (magic bytes)
      if (buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
        return 'pdf'; // %PDF
      }
      
      // Check PNG signature
      if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        return 'png'; // PNG
      }
      
      // Check JPEG signature
      if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        return 'jpg'; // JPEG
      }
      
      return 'unknown';
    } catch (error) {
      console.error('Error detecting file type:', error);
      return 'unknown';
    }
  }

  /**
   * Extract text from invoice image or PDF
   * @param {string} filePath - Path to the invoice file
   * @returns {Promise<string>} Extracted text
   */
  async extractInvoiceData(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('Invoice file not found');
      }

      const ext = path.extname(filePath).toLowerCase();
      const actualType = this.detectFileType(filePath);
      
      console.log(`📄 Processing file: ${path.basename(filePath)}`);
      console.log(`   Extension: ${ext}, Actual type: ${actualType}`);
      
      // If it's actually a PDF (regardless of extension), extract text directly without OCR
      if (actualType === 'pdf') {
        console.log('✅ PDF detected (by content), using direct text extraction (no OCR)...');
        const extractedText = await pdfService.extractTextFromPDF(filePath);
        console.log('✅ PDF text extracted successfully');
        return this.cleanText(extractedText);
      }
      
      // Check if it's a recognized image format
      const supportedImageTypes = ['jpg', 'png'];
      
      if (actualType !== 'unknown' && !supportedImageTypes.includes(actualType)) {
        throw new Error(`Unsupported file type detected. File appears to be: ${actualType}. Please upload JPG, PNG, or PDF files.`);
      }
      
      // If type is unknown, fall back to extension check
      if (actualType === 'unknown') {
        const supportedExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.gif', '.webp'];
        if (!supportedExtensions.includes(ext)) {
          throw new Error(`Unsupported file format: ${ext}. Please upload JPG, PNG, or PDF files.`);
        }
      }

      console.log('🖼️  Image detected, using Tesseract OCR...');
      
      // Use Tesseract to extract text with better configuration
      const result = await Tesseract.recognize(filePath, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
        tessedit_pageseg_mode: Tesseract.PSM.AUTO_OSD, // Auto page segmentation with orientation detection
        tessjs_create_pdf: '0',
        tessjs_create_hocr: '0',
      });

      console.log('✅ OCR extraction completed');
      return this.cleanText(result.data.text);
    } catch (error) {
      console.error('❌ OCR extraction error:', error);
      throw new Error(`Failed to extract text from invoice: ${error.message}`);
    }
  }

  /**
   * Clean extracted text
   * @param {string} text - Raw extracted text
   * @returns {string} Cleaned text
   */
  cleanText(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Parse extracted text to find invoice data
   * @param {string} rawText - Extracted text from invoice
   * @returns {Object} Parsed invoice data
   */
  parseInvoiceText(rawText) {
    const result = {
      detectedProductName: null,
      detectedPurchaseDate: null,
      detectedOrderId: null,
      detectedAmount: null,
      detectedVendor: null,
      detectedHSN: null,
      detectedFSN: null,
    };

    console.log('=== OCR RAW TEXT ===');
    console.log(rawText);
    console.log('=== END RAW TEXT ===\n');

    // Extract purchase date
    result.detectedPurchaseDate = this.extractDate(rawText);
    console.log('Detected Date:', result.detectedPurchaseDate);

    // Extract order ID
    result.detectedOrderId = this.extractOrderId(rawText);
    console.log('Detected Order ID:', result.detectedOrderId);

    // Extract vendor/store name
    console.log('\n🏪 Extracting Vendor...');
    result.detectedVendor = this.extractVendor(rawText);
    console.log('Detected Vendor:', result.detectedVendor);

    // Extract product name
    console.log('\n📦 Extracting Product Name...');
    result.detectedProductName = this.extractProductName(rawText);
    console.log('Detected Product:', result.detectedProductName);

    // Extract amount
    result.detectedAmount = this.extractAmount(rawText);
    console.log('Detected Amount:', result.detectedAmount);

    // Extract HSN/SAC code
    result.detectedHSN = this.extractHSN(rawText);
    console.log('Detected HSN/SAC:', result.detectedHSN);

    // Extract FSN (Flipkart Serial Number)
    result.detectedFSN = this.extractFSN(rawText);
    console.log('Detected FSN:', result.detectedFSN);
    
    console.log('===================\n');

    return result;
  }

  /**
   * Extract date from text (supports multiple formats)
   * @param {string} text
   * @returns {string|null} Detected date in YYYY-MM-DD format
   */
  extractDate(text) {
    // Priority 1: Look for dates with contextual labels (Invoice Date, Order Date)
    const contextualPatterns = [
      /(?:Invoice\s+Date|Order\s+Date|Date)[:\s]*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i,
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s*(?:Invoice\s+Date|Order\s+Date)/i,
    ];

    for (const pattern of contextualPatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          // DD-MM-YYYY format (common in Indian invoices)
          const day = parseInt(match[1]);
          const month = parseInt(match[2]);
          const year = parseInt(match[3]);
          
          // Validate the date makes sense
          if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
            const dateObj = new Date(year, month - 1, day);
            if (!isNaN(dateObj.getTime())) {
              return dateObj.toISOString().split('T')[0];
            }
          }
        } catch (error) {
          continue;
        }
      }
    }
    
    // Priority 2: General date patterns (as fallback)
    const datePatterns = [
      // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (Amazon uses dots)
      /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/,
      // YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
      /\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/,
      // DD Month YYYY (e.g., 25 January 2024)
      /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          // Try to parse the date
          let dateObj;
          
          if (match[0].includes('January') || match[0].includes('February') || /[A-Za-z]/.test(match[0])) {
            // Month name format
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                'July', 'August', 'September', 'October', 'November', 'December'];
            const month = monthNames.findIndex(m => match[2].toLowerCase() === m.toLowerCase()) + 1;
            dateObj = new Date(match[3], month - 1, match[1]);
          } else if (match[1].length === 4) {
            // YYYY-MM-DD format
            dateObj = new Date(match[1], match[2] - 1, match[3]);
          } else {
            // DD/MM/YYYY format (assuming day first - common in India)
            const day = parseInt(match[1]);
            const month = parseInt(match[2]);
            const year = parseInt(match[3]);
            
            // Validate reasonable date ranges
            if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
              dateObj = new Date(year, month - 1, day);
            }
          }

          if (dateObj && !isNaN(dateObj.getTime())) {
            return dateObj.toISOString().split('T')[0];
          }
        } catch (error) {
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Extract order/invoice ID from text
   * @param {string} text
   * @returns {string|null}
   */
  extractOrderId(text) {
    if (!text) return null;

    // Step 1: Normalize common OCR mistakes
    let normalizedText = text
      // Fix "lD" (lowercase L + uppercase D) to "ID"
      .replace(/\blD\b/g, 'ID')
      .replace(/\bOrder\s*lD/gi, 'Order ID')
      // Fix "0D" (zero + D) at word boundary to "OD" (letter O + D)
      .replace(/\b0D(?=\d)/g, 'OD')
      // Fix "O" followed by digit to "0" (zero) - but only in likely ID contexts
      .replace(/([A-Z]{2,})O(\d)/g, '$10$2')
      // Fix digit followed by "O" to "0" (zero)
      .replace(/(\d)O(\d)/g, '$10$2')
      .replace(/(\d)O\b/g, '$10');

    // Step 2: Define detection patterns in priority order
    
    // Pattern 1: Explicit Order ID with label
    const pattern1 = /Order\s*(?:ID|Number)[:\s]*([A-Z0-9\-]{10,30})/i;
    
    // Pattern 2: Amazon style (171-4078830-4755561) - number-number-number
    const pattern2 = /\b\d{3}-\d{7,10}-\d{7,10}\b/;
    
    // Pattern 3: Flipkart style (OD followed by 10-20 digits)
    const pattern3 = /\bOD[0-9]{10,20}\b/;
    
    // Pattern 4: Invoice Number fallback
    const pattern4 = /Invoice\s*(?:Number|No\.?)[:\s#]*([A-Z0-9\-]{6,25})/i;
    
    // Pattern 5: Multiline case (Order and ID on separate lines)
    const pattern5 = /Order[\s\n]*(?:ID|Number)[:\s]*([A-Z0-9\-]{10,30})/i;

    // Step 3: Try patterns in safe matching order
    
    // Try Pattern 1: Explicit Order ID/Number
    let match = normalizedText.match(pattern1);
    if (match && match[1]) {
      const orderId = match[1].trim();
      if (this.isValidOrderId(orderId)) {
        console.log('   [OrderID] Found via explicit pattern:', orderId);
        return orderId;
      }
    }

    // Try Pattern 2: Amazon style (xxx-xxxxxxx-xxxxxxx)
    match = normalizedText.match(pattern2);
    if (match) {
      const orderId = match[0].trim();
      if (this.isValidOrderId(orderId)) {
        console.log('   [OrderID] Found via Amazon pattern:', orderId);
        return orderId;
      }
    }

    // Try Pattern 3: Flipkart style OD prefix
    match = normalizedText.match(pattern3);
    if (match) {
      const orderId = match[0].trim();
      if (this.isValidOrderId(orderId)) {
        console.log('   [OrderID] Found via Flipkart pattern:', orderId);
        return orderId;
      }
    }

    // Try Pattern 5: Multiline Order ID
    match = normalizedText.match(pattern5);
    if (match && match[1]) {
      const orderId = match[1].trim();
      if (this.isValidOrderId(orderId)) {
        console.log('   [OrderID] Found via multiline pattern:', orderId);
        return orderId;
      }
    }

    // Try Pattern 4: Invoice Number as fallback
    match = normalizedText.match(pattern4);
    if (match && match[1]) {
      const orderId = match[1].trim();
      if (this.isValidOrderId(orderId)) {
        return orderId;
      }
    }

    // No valid match found
    return null;
  }

  /**
   * Validate if extracted string is a valid order ID
   * @param {string} orderId
   * @returns {boolean}
   */
  isValidOrderId(orderId) {
    if (!orderId || orderId.length < 5) {
      return false;
    }

    // Must contain at least one digit
    if (!/\d/.test(orderId)) {
      return false;
    }

    // Invalid words that should not be considered order IDs
    const invalidWords = ['sold', 'by', 'to', 'from', 'the', 'and', 'total', 'amount', 
                          'price', 'date', 'tax', 'bill', 'invoice', 'order', 'receipt',
                          'number', 'hsn', 'sac', 'cgst', 'sgst', 'igst'];
    
    const lowerOrderId = orderId.toLowerCase();
    if (invalidWords.some(word => lowerOrderId === word)) {
      return false;
    }

    return true;
  }

  /**
   * Extract product name from text
   * @param {string} text
   * @returns {string|null}
   */
  extractProductName(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Words that indicate table headers or metadata (not product names)
    const tableHeaderWords = ['qty', 'quantity', 'price', 'amount', 'total', 'subtotal', 
                              'discount', 'tax', 'cgst', 'sgst', 'igst', 'gst', 'gross', 
                              'taxable', 'rate', 'hsn', 'sac', 'unit', 'coupons', 'value'];
    
    // Look for product/item keywords
    const productKeywords = ['product', 'title', 'item', 'description', 'article', 'particulars'];
    
    // Pattern 1: Look for lines after product table headers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      // If line contains product keyword, look ahead for actual product name
      if (productKeywords.some(keyword => line.includes(keyword))) {
        console.log('   [Product] Found product keyword at line', i, ':', lines[i]);
        
        // Check next few lines for product name (skip table headers and metadata)
        for (let j = i + 1; j < Math.min(i + 25, lines.length); j++) {
          let potentialProduct = lines[j];
          const lowerProduct = potentialProduct.toLowerCase();
          
          // Skip obviously bad lines
          if (potentialProduct.startsWith('/') || 
              potentialProduct.startsWith('*') ||
              /^e\s*\.\s*&\s*o\s*\.\s*e\s*\./i.test(potentialProduct) ||
              /^page\s+\d+\s+of\s+\d+/i.test(potentialProduct) ||
              /^(fsn|hsn|sac|sku|warranty|cgst|sgst|igst|shipping|total|utgst)[:\s]/i.test(potentialProduct)) {
            continue;
          }
          
          // Skip single-word currency/unit lines (like "Value ₹", "Amount ₹")
          if (/^(value|amount|gross|discount|taxable)\s*[₹\$€£]?\s*$/i.test(potentialProduct)) {
            console.log('   [Product] Skipping currency line at line', j, ':', potentialProduct);
            continue;
          }
          
          // Skip lines that are just currency symbols or numbers
          if (/^[₹\$€£\d\s\.,]+$/.test(potentialProduct)) {
            continue;
          }
          
          // Skip if it's a table header row (contains multiple header keywords)
          const headerWordCount = tableHeaderWords.filter(word => 
            lowerProduct.includes(word)
          ).length;
          
          if (headerWordCount >= 2) {
            console.log('   [Product] Skipping table header at line', j, ':', potentialProduct.substring(0, 50));
            continue;
          }
          
          // Clean the product name (remove trailing numbers/prices from table)
          potentialProduct = this.cleanProductName(potentialProduct);
          
          // Check if product name continues on next line (for PDF multi-line names)
          // Amazon products can be very long (100+ chars), so increase limit to 200
          if (potentialProduct.length > 5 && potentialProduct.length < 200 && 
              !/^[\d\.\$\₹\€\£\,\s\/]+$/.test(potentialProduct) &&
              headerWordCount === 0) {
            
            // Try to merge with next lines if they look like a continuation (Amazon descriptions are multi-line)
            let mergedProduct = potentialProduct;
            let linesChecked = 0;
            
            for (let k = j + 1; k < Math.min(j + 8, lines.length) && linesChecked < 5; k++) {
              const nextLine = lines[k];
              const nextLower = nextLine.toLowerCase();
              
              // Stop if we hit metadata lines
              if (/^(fsn|hsn|sac|warranty|cgst|sgst|igst|shipping|total)[:\s]/i.test(nextLine)) {
                break;
              }
              
              // Stop if we hit table structure or numbers
              if (/^[\d\.,₹\$€£\s]+$/.test(nextLine) || nextLine.startsWith('/')) {
                break;
              }
              
              const nextHeaderCount = tableHeaderWords.filter(word => nextLower.includes(word)).length;
              
              // If next line has multiple header words, we've hit the next row
              if (nextHeaderCount >= 2) {
                break;
              }
              
              // Merge lines that appear to be product description continuation
              if (nextLine.length > 0 && nextLine.length < 150 && nextHeaderCount === 0) {
                const cleanedNext = this.cleanProductName(nextLine);
                if (cleanedNext.length > 5 && mergedProduct.length + cleanedNext.length < 200) {
                  mergedProduct = `${mergedProduct} ${cleanedNext}`.trim();
                  console.log('   [Product] Merged line', k, ':', cleanedNext.substring(0, 50));
                  linesChecked++;
                } else {
                  break;
                }
              } else {
                break;
              }
            }
            
            console.log('   [Product] Found:', mergedProduct);
            return mergedProduct;
          }
        }
      }
    }

    console.log('   [Product] Fallback search starting...');
    
    // Fallback: look for lines that might be product names
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      
      // Skip bad matches
      if (line.startsWith('/') || 
          line.startsWith('*') ||
          /^e\s*\.\s*&\s*o\s*\.\s*e\s*\./i.test(line) ||
          /^page\s+\d+\s+of\s+\d+/i.test(line) ||
          /^(fsn|hsn|sac|sku|warranty|cgst|sgst|shipping)[:\s]/i.test(line) ||
          /^(value|amount|gross|discount|taxable)\s*[₹\$€£]?\s*$/i.test(line)) {
        continue;
      }
      
      // Count how many table header words are in this line
      const headerWordCount = tableHeaderWords.filter(word => 
        lowerLine.includes(word)
      ).length;
      
      // Skip if too many header words
      if (headerWordCount >= 2) continue;
      
      // Clean the product name
      const cleanedLine = this.cleanProductName(line);
      
      // Skip short lines, numeric lines, and lines with common invoice terms
      // Allow longer product names (up to 200 chars for Amazon)
      if (cleanedLine.length > 10 && cleanedLine.length < 200 && 
          !/^[\d\.\$\₹\€\£\,\s\/]+$/.test(cleanedLine) &&
          !/invoice|receipt|order|date|bill|payment|customer|seller|vendor|e\s*\.\s*&\s*o\s*\.\s*e\s*\./i.test(cleanedLine)) {
        console.log('   [Product] Found via fallback:', cleanedLine);
        return cleanedLine;
      }
    }

    console.log('   [Product] Not found');
    return null;
  }

  /**
   * Clean product name by removing trailing numbers and prices
   * @param {string} productName - Raw product name
   * @returns {string} Cleaned product name
   */
  cleanProductName(productName) {
    // Remove patterns like "1 549.00 0.00 465.26 41.87" at the end
    // This handles cases where OCR reads across table columns
    
    // Pattern: Find where numbers start appearing (quantity followed by prices)
    // Look for pattern: [product name] [1-2 digit qty] [prices...]
    const qtyPricePattern = /\s+\d{1,2}\s+[\d\.,\s]+$/;
    let cleaned = productName.replace(qtyPricePattern, '');
    
    // Remove product codes in parentheses at the end (e.g., "( B0BTM24FN )")
    cleaned = cleaned.replace(/\s*\(\s*[A-Z0-9]+\s*\)\s*$/i, '');
    
    // Also remove trailing isolated numbers/prices
    cleaned = cleaned.replace(/\s+[\d\.,]+\s*$/g, '').trim();
    
    // Remove multiple spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }

  /**
   * Extract vendor/store name from text
   * @param {string} text
   * @returns {string|null}
   */
  extractVendor(text) {
    // Priority 1: Look for "Sold By:" pattern (Flipkart/Amazon) - most reliable
    const soldByPatterns = [
      /Sold\s+By[:\s]+([A-Za-z0-9\s\-\.,&]+?)(?:\s*,\s*|\n|$)/i,
      /Sold\s+By[:\s]+([A-Za-z0-9\s\-\.&]+?)\s*(?:Ltd|Limited|Private|Pvt|Inc|Corp|LLC)/i,
    ];
    
    for (const pattern of soldByPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let vendorName = match[1].trim();
        // Include company suffix if it exists
        if (pattern.toString().includes('Ltd|Limited')) {
          const suffixMatch = text.substring(match.index + match[0].length - 10).match(/^(Ltd|Limited|Private|Pvt|Inc|Corp|LLC)/i);
          if (suffixMatch) {
            vendorName += ' ' + suffixMatch[1];
          }
        }
        vendorName = this.cleanVendorName(vendorName);
        if (vendorName.length > 3 && vendorName.length < 100) {
          console.log('   [Vendor] Found via Sold By pattern:', vendorName);
          return vendorName;
        }
      }
    }

    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Priority 2: Look for vendor keywords in lines
    const vendorKeywords = ['sold by', 'from', 'seller', 'vendor', 'store', 'company'];
    
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      
      // Skip obviously bad matches
      if (/^e\s*\.\s*&\s*o\s*\.\s*e\s*\./i.test(line) || 
          /^page\s+\d+\s+of\s+\d+/i.test(line) ||
          /^\*?keep\s+this/i.test(line)) {
        continue;
      }
      
      // Check if line contains vendor keywords with the name in same line
      for (const keyword of vendorKeywords) {
        if (lowerLine.includes(keyword)) {
          // Extract vendor name after the keyword
          const keywordIndex = lowerLine.indexOf(keyword);
          const afterKeyword = line.substring(keywordIndex + keyword.length).trim();
          
          // Remove leading colons/separators
          let vendorName = afterKeyword.replace(/^[:;\-\s]+/, '').trim();
          
          // Clean up common OCR artifacts and trailing junk
          vendorName = this.cleanVendorName(vendorName);
          
          if (vendorName.length > 3 && vendorName.length < 100) {
            console.log('   [Vendor] Found via keyword inline:', vendorName);
            return vendorName;
          }
        }
      }
      
      // Check next line after keyword
      const hasVendorKeyword = vendorKeywords.some(keyword => lowerLine.includes(keyword));
      if (hasVendorKeyword && i + 1 < lines.length) {
        let potentialVendor = lines[i + 1];
        potentialVendor = this.cleanVendorName(potentialVendor);
        
        if (potentialVendor.length > 3 && potentialVendor.length < 100 &&
            !/^\d+$/.test(potentialVendor) &&
            !/invoice|receipt|bill|date|e\s*\.\s*&\s*o\s*\.\s*e\s*\./i.test(potentialVendor)) {
          console.log('   [Vendor] Found via keyword nextline:', potentialVendor);
          return potentialVendor;
        }
      }
      
      // First non-empty line that looks like a company name (LOWEST priority)
      if (i < 5 && line.length > 3 && line.length < 60 &&
          !/invoice|receipt|bill|order|date|tax|total|e\s*\.\s*&\s*o\s*\.\s*e\s*\.|keep\s+this|page\s+\d+/i.test(lowerLine) &&
          !/^\d+$/.test(line)) {
        // Check if it has capital letters or company indicators
        if (/[A-Z]/.test(line) && /ltd|llc|inc|pvt|private|limited|corp/i.test(line)) {
          const cleaned = this.cleanVendorName(line);
          console.log('   [Vendor] Found via company name heuristic:', cleaned);
          return cleaned;
        }
      }
    }
    
    console.log('   [Vendor] Not found');
    return null;
  }

  /**
   * Clean vendor name by removing trailing artifacts
   * @param {string} vendorName - Raw vendor name
   * @returns {string} Cleaned vendor name
   */
  cleanVendorName(vendorName) {
    // Remove trailing commas and then any trailing short words (like "a", "an", etc.)
    let cleaned = vendorName.replace(/\s*,\s*$/g, '').trim();
    
    // Remove trailing single letters or short junk (like ", a" or ", an")
    cleaned = cleaned.replace(/[,;]\s*[A-Za-z]{1,2}\s*$/i, '');
    
    // Remove trailing parentheses with short content
    cleaned = cleaned.replace(/\s*\([^)]{1,5}\)\s*$/g, '');
    
    // Remove leading/trailing special characters
    cleaned = cleaned.replace(/^[,:;\-\s]+|[,:;\-\s]+$/g, '');
    
    // Remove multiple spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }

  /**
   * Extract amount/price from text
   * @param {string} text
   * @returns {number|null}
   */
  extractAmount(text) {
    // Most specific patterns first - prioritize final totals
    const priorityPatterns = [
      /Grand\s+Total[\s:]*[₹\$€£]?\s*(\d+[,\d]*\.\d{2})/i,
      /Grand\s+Total[\s:]*[₹\$€£]?\s*(\d+[,\d]*)/i,
      /Net\s+Total[\s:]*[₹\$€£]?\s*(\d+[,\d]*\.?\d*)/i,
      /Final\s+Total[\s:]*[₹\$€£]?\s*(\d+[,\d]*\.?\d*)/i,
      /Total\s+Amount[\s:]*[₹\$€£]?\s*(\d+[,\d]*\.?\d*)/i,
      /Amount\s+Payable[\s:]*[₹\$€£]?\s*(\d+[,\d]*\.?\d*)/i,
    ];

    // Check priority patterns first
    for (const pattern of priorityPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(amount) && amount > 0 && amount < 1000000) {
          return amount;
        }
      }
    }

    // Fallback patterns
    const fallbackPatterns = [
      /(?:Total)[\s:]*[₹\$€£]?\s*(\d+[,\d]*\.?\d*)/i,
      /[₹\$€£]\s*(\d+[,\d]*\.\d{2})/,
    ];

    let validAmounts = [];

    for (const pattern of fallbackPatterns) {
      const matches = text.matchAll(new RegExp(pattern.source, pattern.flags + 'g'));
      for (const match of matches) {
        if (match && match[1]) {
          const amount = parseFloat(match[1].replace(/,/g, ''));
          // Filter reasonable amounts (not dates or item quantities)
          if (!isNaN(amount) && amount > 10 && amount < 1000000) {
            validAmounts.push(amount);
          }
        }
      }
    }

    // Return the largest valid amount from fallback
    if (validAmounts.length > 0) {
      return Math.max(...validAmounts);
    }

    return null;
  }

  /**
   * Extract HSN/SAC code from text
   * @param {string} text
   * @returns {string|null}
   */
  extractHSN(text) {
    const patterns = [
      /(?:HSN|SAC)[\s:\/]*(\d{4,8})/i,
      /HSN[\s:\/]+Code[\s:]*(\d{4,8})/i,
      /SAC[\s:\/]+Code[\s:]*(\d{4,8})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extract FSN (Flipkart Serial Number) from text
   * @param {string} text
   * @returns {string|null}
   */
  extractFSN(text) {
    const patterns = [
      /\bFSN[\s:]*([A-Z0-9]{10,})/i,
      /\b(EK[A-Z0-9]{10,})\b/,  // Flipkart FSN pattern
      /\b(FLI[A-Z0-9]{8,})\b/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Process invoice and return extracted data
   * @param {string} filePath - Path to invoice file
   * @returns {Promise<Object>} Extracted invoice data
   */
  async processInvoice(filePath) {
    try {
      const rawText = await this.extractInvoiceData(filePath);
      const parsedData = this.parseInvoiceText(rawText);
      
      return {
        success: true,
        rawText,
        extractedData: parsedData,
      };
    } catch (error) {
      console.error('Invoice processing error:', error);
      return {
        success: false,
        error: error.message,
        extractedData: null,
      };
    }
  }
}

module.exports = new OCRService();
