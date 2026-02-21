const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');

class OCRService {
  /**
   * Extract text from invoice image
   * @param {string} filePath - Path to the invoice file
   * @returns {Promise<string>} Extracted text
   */
  async extractInvoiceData(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('Invoice file not found');
      }

      // Check file extension - Tesseract only supports images
      const ext = path.extname(filePath).toLowerCase();
      const supportedFormats = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.gif', '.webp'];
      
      if (!supportedFormats.includes(ext)) {
        throw new Error(`OCR only supports image formats (JPG, PNG, etc.). PDF files cannot be processed. Please upload an image of your invoice instead.`);
      }

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

      return this.cleanText(result.data.text);
    } catch (error) {
      console.error('OCR extraction error:', error);
      // Re-throw with original message if it's our validation error
      if (error.message.includes('OCR only supports')) {
        throw error;
      }
      throw new Error('Failed to extract text from invoice');
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
    result.detectedVendor = this.extractVendor(rawText);
    console.log('Detected Vendor:', result.detectedVendor);

    // Extract product name
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
    const datePatterns = [
      // DD/MM/YYYY or DD-MM-YYYY
      /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/,
      // MM/DD/YYYY or MM-DD-YYYY
      /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/,
      // YYYY-MM-DD or YYYY/MM/DD
      /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/,
      // DD Month YYYY (e.g., 25 January 2024)
      /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          // Try to parse the date
          let dateObj;
          
          if (match[0].includes('January') || match[0].includes('February')) {
            // Month name format
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                'July', 'August', 'September', 'October', 'November', 'December'];
            const month = monthNames.findIndex(m => match[2].toLowerCase() === m.toLowerCase()) + 1;
            dateObj = new Date(match[3], month - 1, match[1]);
          } else if (match[1].length === 4) {
            // YYYY-MM-DD format
            dateObj = new Date(match[1], match[2] - 1, match[3]);
          } else {
            // DD/MM/YYYY format (assuming day first)
            dateObj = new Date(match[3], match[2] - 1, match[1]);
          }

          if (!isNaN(dateObj.getTime())) {
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
    const pattern1 = /Order\s*ID[:\s]*([A-Z0-9]{10,25})/i;
    
    // Pattern 2: Flipkart style (OD followed by 10-20 digits)
    const pattern2 = /\bOD[0-9]{10,20}\b/;
    
    // Pattern 3: Invoice Number fallback
    const pattern3 = /Invoice\s*(?:Number|No\.?)[:\s#]*([A-Z0-9\-]{6,25})/i;
    
    // Pattern 4: Multiline case (Order and ID on separate lines)
    const pattern4 = /Order[\s\n]*ID[:\s]*([A-Z0-9]{10,25})/i;

    // Step 3: Try patterns in safe matching order
    
    // Try Pattern 1: Explicit Order ID
    let match = normalizedText.match(pattern1);
    if (match && match[1]) {
      const orderId = match[1].trim();
      if (this.isValidOrderId(orderId)) {
        return orderId;
      }
    }

    // Try Pattern 4: Multiline Order ID
    match = normalizedText.match(pattern4);
    if (match && match[1]) {
      const orderId = match[1].trim();
      if (this.isValidOrderId(orderId)) {
        return orderId;
      }
    }

    // Try Pattern 2: Flipkart style OD prefix
    match = normalizedText.match(pattern2);
    if (match) {
      const orderId = match[0].trim();
      if (this.isValidOrderId(orderId)) {
        return orderId;
      }
    }

    // Try Pattern 3: Invoice Number as fallback
    match = normalizedText.match(pattern3);
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
                              'taxable', 'rate', 'hsn', 'sac', 'unit'];
    
    // Look for product/item keywords
    const productKeywords = ['product', 'item', 'description', 'article', 'particulars'];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      // If line contains product keyword, look ahead for actual product name
      if (productKeywords.some(keyword => line.includes(keyword))) {
        // Check next few lines for product name (skip table headers)
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          let potentialProduct = lines[j];
          const lowerProduct = potentialProduct.toLowerCase();
          
          // Skip if it's a table header row (contains multiple header keywords)
          const headerWordCount = tableHeaderWords.filter(word => 
            lowerProduct.includes(word)
          ).length;
          
          if (headerWordCount >= 3) {
            continue; // This is likely a table header, skip it
          }
          
          // Clean the product name (remove trailing numbers/prices from table)
          potentialProduct = this.cleanProductName(potentialProduct);
          
          // Validate it's a reasonable product name
          if (potentialProduct.length > 5 && potentialProduct.length < 100 && 
              !/^[\d\.\$\₹\€\£\,\s]+$/.test(potentialProduct) &&
              headerWordCount === 0) {
            return potentialProduct;
          }
        }
      }
    }

    // Fallback: look for lines that might be product names
    for (let line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Count how many table header words are in this line
      const headerWordCount = tableHeaderWords.filter(word => 
        lowerLine.includes(word)
      ).length;
      
      // Skip if too many header words
      if (headerWordCount >= 2) continue;
      
      // Clean the product name
      const cleanedLine = this.cleanProductName(line);
      
      // Skip short lines, numeric lines, and lines with common invoice terms
      if (cleanedLine.length > 10 && cleanedLine.length < 100 && 
          !/^[\d\.\$\₹\€\£\,\s]+$/.test(cleanedLine) &&
          !/invoice|receipt|order|date|bill|payment|customer|seller|vendor/i.test(cleanedLine)) {
        return cleanedLine;
      }
    }

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
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Vendor name is often at the top of the invoice
    // Look for lines before common invoice terms appear
    const vendorKeywords = ['sold by', 'from', 'seller', 'vendor', 'store', 'company'];
    
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      
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
          
          if (vendorName.length > 3 && vendorName.length < 80) {
            return vendorName;
          }
        }
      }
      
      // Check next line after keyword
      const hasVendorKeyword = vendorKeywords.some(keyword => lowerLine.includes(keyword));
      if (hasVendorKeyword && i + 1 < lines.length) {
        let potentialVendor = lines[i + 1];
        potentialVendor = this.cleanVendorName(potentialVendor);
        
        if (potentialVendor.length > 3 && potentialVendor.length < 80 &&
            !/^\d+$/.test(potentialVendor) &&
            !/invoice|receipt|bill|date/i.test(potentialVendor)) {
          return potentialVendor;
        }
      }
      
      // First non-empty line that looks like a company name
      if (i < 3 && line.length > 3 && line.length < 60 &&
          !/invoice|receipt|bill|order|date|tax|total/i.test(lowerLine) &&
          !/^\d+$/.test(line)) {
        // Check if it has capital letters or company indicators
        if (/[A-Z]/.test(line) || /ltd|llc|inc|pvt|private|limited|corp/i.test(line)) {
          return this.cleanVendorName(line);
        }
      }
    }
    
    return null;
  }

  /**
   * Clean vendor name by removing trailing artifacts
   * @param {string} vendorName - Raw vendor name
   * @returns {string} Cleaned vendor name
   */
  cleanVendorName(vendorName) {
    // Remove trailing commas and junk characters
    let cleaned = vendorName.replace(/[,;]\s*[A-Za-z]{1,2}\s+[a-z]{1,3}\)?\s*$/i, '');
    
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
