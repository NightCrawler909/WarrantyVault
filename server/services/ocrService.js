const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');
const pdfService = require('./pdfService');
const imagePreprocessService = require('./imagePreprocessService');

class OCRService {
  constructor() {
    // Tesseract configuration for optimal accuracy
    this.tesseractConfig = {
      lang: 'eng',
      oem: Tesseract.OEM.LSTM_ONLY, // Use LSTM neural network (best accuracy)
      psm: Tesseract.PSM.AUTO, // Automatic page segmentation
      preserve_interword_spaces: '1',
      tessedit_char_whitelist: '', // Allow all characters
      // Performance settings
      tessedit_pageseg_mode: '6', // Assume uniform block of text
      tessedit_ocr_engine_mode: '1', // LSTM only
    };
  }
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
   * Extract text from invoice image or PDF using optimized OCR pipeline
   * @param {string} filePath - Path to the invoice file
   * @returns {Promise<string>} Extracted text
   */
  async extractInvoiceData(filePath) {
    let preprocessedPath = null;
    let pdfImagePath = null;

    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('Invoice file not found');
      }

      const ext = path.extname(filePath).toLowerCase();
      const actualType = this.detectFileType(filePath);
      
      console.log(`\n📄 Processing file: ${path.basename(filePath)}`);
      console.log(`   Extension: ${ext}, Actual type: ${actualType}`);
      
      // PART 1: Smart PDF Processing
      if (actualType === 'pdf') {
        console.log('✅ PDF detected - using smart processing pipeline...');
        
        const pdfResult = await pdfService.processPDF(filePath);
        
        if (!pdfResult.requiresOCR) {
          // PDF has embedded text - use it directly
          console.log('✅ Using embedded PDF text (no OCR required)');
          return this.advancedTextCleaning(pdfResult.text);
        }
        
        // PDF needs OCR - use converted image
        console.log('⚠️  PDF requires OCR - using converted image');
        pdfImagePath = pdfResult.imagePath;
        filePath = pdfImagePath; // Update filePath to the converted image
      }
      
      // Check if it's a recognized image format
      const supportedImageTypes = ['jpg', 'png'];
      
      if (actualType !== 'unknown' && actualType !== 'pdf' && !supportedImageTypes.includes(actualType)) {
        throw new Error(`Unsupported file type detected. File appears to be: ${actualType}. Please upload JPG, PNG, or PDF files.`);
      }
      
      // If type is unknown, fall back to extension check
      if (actualType === 'unknown') {
        const supportedExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.gif', '.webp'];
        if (!supportedExtensions.includes(ext)) {
          throw new Error(`Unsupported file format: ${ext}. Please upload JPG, PNG, or PDF files.`);
        }
      }

      // PART 2 & 3: Image Quality Analysis & Preprocessing
      console.log('🖼️  Analyzing image quality...');
      const quality = await imagePreprocessService.analyzeImageQuality(filePath);
      console.log(`   Resolution: ${quality.width}x${quality.height}`);
      console.log(`   Format: ${quality.format}, Color: ${quality.isColor ? 'Yes' : 'No'}`);
      console.log(`   Preprocessing needed: ${quality.needsPreprocessing ? 'Yes' : 'No'} (${quality.recommendedLevel})`);

      if (quality.needsPreprocessing) {
        console.log('🔧 Preprocessing image for optimal OCR...');
        
        if (quality.recommendedLevel === 'aggressive') {
          preprocessedPath = await imagePreprocessService.aggressivePreprocess(filePath);
        } else if (quality.recommendedLevel === 'light') {
          preprocessedPath = await imagePreprocessService.lightPreprocess(filePath);
        } else {
          preprocessedPath = await imagePreprocessService.preprocessForOCR(filePath);
        }
        
        // Use preprocessed image for OCR
        filePath = preprocessedPath;
      }

      // PART 4: Run Tesseract with Improved Configuration
      console.log('🔍 Running enhanced Tesseract OCR...');
      console.log(`   Config: LSTM engine, PSM ${this.tesseractConfig.psm}, preserve spaces`);
      
      const result = await Tesseract.recognize(filePath, this.tesseractConfig.lang, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100);
            if (progress % 20 === 0 || progress === 100) {
              console.log(`   OCR Progress: ${progress}%`);
            }
          }
        },
        ...this.tesseractConfig,
      });

      const confidence = result.data.confidence || 0;
      console.log(`✅ OCR completed - Confidence: ${confidence.toFixed(1)}%`);
      
      if (confidence < 60) {
        console.log('⚠️  Low confidence - results may be inaccurate');
      }

      // PART 5: Advanced Text Cleaning
      const cleanedText = this.advancedTextCleaning(result.data.text);
      
      return cleanedText;
    } catch (error) {
      console.error('❌ OCR extraction error:', error);
      throw new Error(`Failed to extract text from invoice: ${error.message}`);
    } finally {
      // PART 7: Cleanup temporary files
      if (preprocessedPath) {
        imagePreprocessService.cleanupTempFile(preprocessedPath);
      }
      if (pdfImagePath) {
        pdfService.cleanupTempImage(pdfImagePath);
      }
      
      // Clean up old temp files (async, don't wait)
      setTimeout(() => {
        imagePreprocessService.cleanupOldTempFiles();
      }, 1000);
    }
  }

  /**
   * Advanced text cleaning with OCR error correction
   * @param {string} text - Raw extracted text
   * @returns {string} Cleaned and corrected text
   */
  advancedTextCleaning(text) {
    if (!text) return '';

    let cleaned = text;

    // Step 1: Normalize line breaks
    cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Step 2: Fix common OCR character mistakes
    // lD -> ID (lowercase L + uppercase D)
    cleaned = cleaned.replace(/\blD\b/g, 'ID');
    cleaned = cleaned.replace(/\bOrder\s*lD/gi, 'Order ID');
    cleaned = cleaned.replace(/\bInvoice\s*lD/gi, 'Invoice ID');
    
    // 0D -> OD at word boundary (zero to letter O)
    cleaned = cleaned.replace(/\b0D(?=\d)/g, 'OD');
    
    // O mistaken as 0 in alphanumeric IDs
    cleaned = cleaned.replace(/([A-Z]{2,})O(\d)/g, '$10$2');
    cleaned = cleaned.replace(/(\d)O(\d)/g, '$10$2');
    cleaned = cleaned.replace(/(\d)O\b/g, '$10');
    
    // Fix rupee symbol variations
    cleaned = cleaned.replace(/Rs\.?\s*/g, '₹');
    cleaned = cleaned.replace(/INR\s*/g, '₹');
    
    // Fix common word breaks
    cleaned = cleaned.replace(/I\s+nvoice/gi, 'Invoice');
    cleaned = cleaned.replace(/O\s+rder/gi, 'Order');
    cleaned = cleaned.replace(/D\s+ate/gi, 'Date');
    cleaned = cleaned.replace(/A\s+mount/gi, 'Amount');
    cleaned = cleaned.replace(/T\s+otal/gi, 'Total');
    
    // Step 3: Remove excessive whitespace
    cleaned = cleaned.replace(/[ \t]+/g, ' '); // Multiple spaces to single space
    cleaned = cleaned.replace(/\n[ \t]+/g, '\n'); // Remove spaces at start of line
    cleaned = cleaned.replace(/[ \t]+\n/g, '\n'); // Remove spaces at end of line
    
    // Step 4: Normalize line breaks (max 2 consecutive)
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // Step 5: Fix broken numbers (spaces within numbers)
    cleaned = cleaned.replace(/(\d)\s+(\d)/g, '$1$2');
    
    // Step 6: Clean up and trim
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Basic text cleaning (legacy - kept for compatibility)
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
   * Detect invoice platform from text
   * @param {string} text - Raw invoice text
   * @returns {string} Platform identifier ('amazon', 'flipkart', 'generic')
   */
  detectPlatform(text) {
    const lowerText = text.toLowerCase();
    
    // Amazon detection
    if (lowerText.includes('amazon.in') || 
        lowerText.includes('amazon seller services') ||
        lowerText.includes('amazon basics') ||
        /order\s*number[:\s]*\d{3}-\d{7,10}-\d{7,10}/i.test(text)) {
      return 'amazon';
    }
    
    // Flipkart detection
    if (lowerText.includes('flipkart') || 
        lowerText.includes('flipkart internet private limited') ||
        /order\s*id[:\s]*od\d{10,}/i.test(text)) {
      return 'flipkart';
    }
    
    return 'generic';
  }

  /**
   * Normalize date format to YYYY-MM-DD
   * @param {string} dateString - Date in various formats
   * @returns {string|null} ISO format date
   */
  normalizeDate(dateString) {
    if (!dateString) return null;
    
    try {
      // Handle DD.MM.YYYY (Amazon format)
      let match = dateString.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
      if (match) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = parseInt(match[3]);
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
          return new Date(year, month - 1, day).toISOString().split('T')[0];
        }
      }
      
      // Handle DD-MM-YYYY (Flipkart format)
      match = dateString.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
      if (match) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = parseInt(match[3]);
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
          return new Date(year, month - 1, day).toISOString().split('T')[0];
        }
      }
      
      // Handle DD/MM/YYYY
      match = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (match) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = parseInt(match[3]);
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
          return new Date(year, month - 1, day).toISOString().split('T')[0];
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract Amazon-specific invoice data with strict validation
   * @param {string} text - Raw invoice text
   * @returns {Object} Extracted data
   */
  extractAmazonData(text) {
    console.log('🔷 Using Amazon-specific extraction...');
    
    const data = {
      platform: 'amazon',
      detectedOrderId: null,
      detectedInvoiceNumber: null,
      detectedOrderDate: null,
      detectedInvoiceDate: null,
      detectedProductName: null,
      detectedAmount: null,
      detectedVendor: null,
      detectedRetailer: null,
      detectedHSN: null,
    };
    
    // A. Order Number: 171-4078830-4755561 (STRICT PATTERN)
    let match = text.match(/Order\s*Number[:\s]*([0-9\-]{10,25})/i);
    if (match) {
      data.detectedOrderId = match[1];
      console.log('   [Amazon] Order Number:', data.detectedOrderId);
    }
    
    // B. Invoice Number: FBOI-61720
    match = text.match(/Invoice\s*Number\s*:?\s*[#:]?\s*([A-Z0-9\-]+)/i);
    if (match && match[1].length >= 5) {
      data.detectedInvoiceNumber = match[1];
      console.log('   [Amazon] Invoice Number:', data.detectedInvoiceNumber);
    }
    
    // C. Purchase Date: Prefer Order Date
    match = text.match(/Order\s*Date[:\s]*([0-9.\-\/]{8,12})/i);
    if (match) {
      data.detectedOrderDate = this.normalizeDate(match[1]);
      console.log('   [Amazon] Order Date:', data.detectedOrderDate);
    }
    
    // Invoice Date (fallback)
    match = text.match(/Invoice\s*Date[:\s]*([0-9.\-\/]{8,12})/i);
    if (match) {
      data.detectedInvoiceDate = this.normalizeDate(match[1]);
      console.log('   [Amazon] Invoice Date:', data.detectedInvoiceDate);
    }
    
    // Use order date or invoice date as purchase date
    data.detectedPurchaseDate = data.detectedOrderDate || data.detectedInvoiceDate;
    
    // Vendor/Seller: "Sold By : RETAILEZ PRIVATE LIMITED"
    match = text.match(/Sold\s*By\s*:?\s*([A-Za-z0-9\s\-\.&,]+?)(?:\s*,|\n|Plot)/i);
    if (match) {
      const vendorName = this.cleanVendorName(match[1]);
      data.detectedVendor = vendorName;
      data.detectedRetailer = vendorName;
      console.log('   [Amazon] Vendor:', data.detectedVendor);
    }
    
    // D. PRODUCT NAME EXTRACTION (CRITICAL FIX)
    data.detectedProductName = this.extractAmazonProductName(text);
    console.log('   [Amazon] Product:', data.detectedProductName);
    
    // E. PRICE EXTRACTION (CRITICAL FIX)
    data.detectedAmount = this.extractAmazonPrice(text);
    console.log('   [Amazon] Amount:', data.detectedAmount);
    
    // HSN/SAC code
    match = text.match(/HSN[:\s]*(\d{4,10})/i);
    if (match) {
      data.detectedHSN = match[1];
      console.log('   [Amazon] HSN:', data.detectedHSN);
    }
    
    return data;
  }

  /**
   * Extract Amazon product name with strict rules
   * @param {string} text - Invoice text
   * @returns {string|null} Product name
   */
  extractAmazonProductName(text) {
    // Invalid product names to reject
    const invalidNames = [
      'tax invoice',
      'original for recipient',
      'bill of supply',
      'page 1 of 1',
      'cash memo',
      'description',
      'sold by',
    ];
    
    // Method 1: Find product between serial number and ₹ symbol
    // Pattern: 1 [Product Name] ₹
    const tableMatch = text.match(/\b1\s+([A-Za-z0-9].+?)(?=₹|\d{2,})/i);
    if (tableMatch && tableMatch[1]) {
      let productName = tableMatch[1].trim();
      
      // Remove product codes in parentheses like ( B0BT1M24FN )
      productName = productName.replace(/\s*\(\s*[A-Z0-9]+\s*\)\s*/gi, ' ');
      
      // Remove trailing numbers/quantities
      productName = productName.replace(/\s+\d{1,3}\s*$/, '');
      
      // Clean up spaces
      productName = productName.replace(/\s+/g, ' ').trim();
      
      // Validate
      if (productName.length > 5 && 
          !invalidNames.some(inv => productName.toLowerCase().includes(inv))) {
        return productName;
      }
    }
    
    // Method 2: Look for "Description" column and get next meaningful line
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let foundDescription = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('description') && lowerLine.includes('unit')) {
        foundDescription = true;
        continue;
      }
      
      if (foundDescription && i < lines.length - 1) {
        const nextLine = lines[i].trim();
        
        // Skip if it's a header, number, or invalid
        if (nextLine.length > 10 && 
            !/^(sl|no\.|description|unit|price|disc)/i.test(nextLine) &&
            !invalidNames.some(inv => nextLine.toLowerCase().includes(inv))) {
          
          let productName = nextLine;
          
          // Remove product codes
          productName = productName.replace(/\s*\(\s*[A-Z0-9]+\s*\)\s*/gi, ' ');
          productName = productName.replace(/\s+/g, ' ').trim();
          
          if (productName.length > 5) {
            return productName;
          }
        }
      }
    }
    
    // Method 3: Fallback to generic extraction
    return this.extractProductName(text);
  }

  /**
   * Extract Amazon price with priority rules
   * @param {string} text - Invoice text
   * @returns {number|null} Amount
   */
  extractAmazonPrice(text) {
    // Priority 1: Look for TOTAL line with ₹
    let match = text.match(/TOTAL:\s*₹?\s*[0-9.,]+\s*₹?\s*([0-9.,]+)/i);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (amount > 0) {
        console.log('   [Amazon Price] Found via TOTAL line:', amount);
        return amount;
      }
    }
    
    // Priority 2: Grand Total
    match = text.match(/Grand\s*Total\s*₹?\s*([0-9.,]+)/i);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (amount > 0) {
        console.log('   [Amazon Price] Found via Grand Total:', amount);
        return amount;
      }
    }
    
    // Priority 3: Total Amount
    match = text.match(/Total\s*Amount\s*₹?\s*([0-9.,]+)/i);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (amount > 0) {
        console.log('   [Amazon Price] Found via Total Amount:', amount);
        return amount;
      }
    }
    
    // Priority 4: Extract all ₹ values and use LAST one (likely the total)
    const allAmounts = [...text.matchAll(/₹\s*([0-9.,]+)/g)];
    if (allAmounts.length > 0) {
      const lastAmount = allAmounts[allAmounts.length - 1];
      const amount = parseFloat(lastAmount[1].replace(/,/g, ''));
      if (amount > 0 && amount < 1000000) { // Sanity check
        console.log('   [Amazon Price] Found via last ₹ value:', amount);
        return amount;
      }
    }
    
    return null;
  }

  /**
   * Extract Flipkart-specific invoice data with strict validation
   * @param {string} text - Raw invoice text
   * @returns {Object} Extracted data
   */
  extractFlipkartData(text) {
    console.log('🔶 Using Flipkart-specific extraction...');
    
    const data = {
      platform: 'flipkart',
      detectedOrderId: null,
      detectedInvoiceNumber: null,
      detectedOrderDate: null,
      detectedInvoiceDate: null,
      detectedProductName: null,
      detectedAmount: null,
      detectedVendor: null,
      detectedRetailer: null,
      detectedHSN: null,
      detectedFSN: null,
    };
    
    // A. Order ID: OD430543585270089100 (STRICT: Must be exactly 20 chars = OD + 18 digits)
    let match = text.match(/\bOD\d{18}\b/);
    if (!match) {
      // Try with label
      match = text.match(/Order\s*ID[:\s]*(OD\d{18})\b/i);
    }
    if (match) {
      const orderId = match[0].startsWith('OD') ? match[0] : match[1];
      // Strict validation: must be exactly 20 characters
      if (orderId && orderId.length === 20) {
        data.detectedOrderId = orderId;
        console.log('   [Flipkart] Order ID:', data.detectedOrderId);
      } else {
        console.log('   [Flipkart] Invalid Order ID length:', orderId?.length, '- expected 20');
      }
    }
    
    // B. Invoice Number # FAFO7Z2401525755
    match = text.match(/Invoice\s*Number\s*[#:]?\s*([A-Z0-9\-]+)/i);
    if (match && match[1].length >= 5) {
      data.detectedInvoiceNumber = match[1];
      console.log('   [Flipkart] Invoice Number:', data.detectedInvoiceNumber);
    }
    
    // C. Purchase Date: Order Date
    match = text.match(/Order\s*Date[:\s]*([0-9.\-\/]{8,12})/i);
    if (match) {
      data.detectedOrderDate = this.normalizeDate(match[1]);
      console.log('   [Flipkart] Order Date:', data.detectedOrderDate);
    }
    
    // Invoice Date (fallback)
    match = text.match(/Invoice\s*Date[:\s]*([0-9.\-\/]{8,12})/i);
    if (match) {
      data.detectedInvoiceDate = this.normalizeDate(match[1]);
      console.log('   [Flipkart] Invoice Date:', data.detectedInvoiceDate);
    }
    
    // Use order date or invoice date as purchase date
    data.detectedPurchaseDate = data.detectedOrderDate || data.detectedInvoiceDate;
    
    // Vendor: "Sold By: Tech-Connect Retail Private Limited"
    match = text.match(/Sold\s*By[:\s]+([A-Za-z0-9\s\-\.,&]+?)(?:\s*,|\n|Warehouse)/i);
    if (match) {
      const vendorName = this.cleanVendorName(match[1]);
      data.detectedVendor = vendorName;
      data.detectedRetailer = vendorName;
      console.log('   [Flipkart] Vendor:', data.detectedVendor);
    }
    
    // D. Product Name (Clean extraction)
    data.detectedProductName = this.extractFlipkartProductName(text);
    console.log('   [Flipkart] Product:', data.detectedProductName);
    
    // E. Price: Grand Total ₹ 549.00
    match = text.match(/Grand\s*Total\s*₹?\s*([0-9.,]+)/i);
    if (!match) {
      match = text.match(/Total\s*₹?\s*([0-9.,]+)/i);
    }
    if (match) {
      data.detectedAmount = parseFloat(match[1].replace(/,/g, ''));
      console.log('   [Flipkart] Amount:', data.detectedAmount);
    }
    
    // HSN/SAC code
    match = text.match(/HSN\/SAC[:\s]*(\d{4,10})/i);
    if (!match) {
      match = text.match(/HSN[:\s]*(\d{4,10})/i);
    }
    if (match) {
      data.detectedHSN = match[1];
      console.log('   [Flipkart] HSN:', data.detectedHSN);
    }
    
    // FSN (Flipkart Serial Number)
    match = text.match(/FSN[:\s]*([A-Z0-9]+)/i);
    if (match) {
      data.detectedFSN = match[1];
      console.log('   [Flipkart] FSN:', data.detectedFSN);
    }
    
    return data;
  }

  /**
   * Extract Flipkart product name with strict table header filtering
   * @param {string} text - Invoice text
   * @returns {string|null} Product name
   */
  extractFlipkartProductName(text) {
    console.log('   [Flipkart Product] Starting extraction...');
    
    // STEP 1: Locate section between "Total items:" and "Grand Total"
    const totalItemsMatch = text.match(/Total items:\s*\d+/i);
    const grandTotalMatch = text.match(/Grand\s*Total/i);
    
    let searchText = text;
    if (totalItemsMatch && grandTotalMatch) {
      const startIdx = totalItemsMatch.index + totalItemsMatch[0].length;
      const endIdx = grandTotalMatch.index;
      searchText = text.substring(startIdx, endIdx);
      console.log('   [Flipkart Product] Isolated table section');
    }
    
    // STEP 2: Split into lines and clean
    const lines = searchText.split('\n')
      .map(l => l.trim())
      .filter(Boolean);
    
    // STEP 3: Filter lines with strict rules
    const tableHeaderKeywords = /gross|discount|taxable|cgst|sgst|utgst|igst|total|qty|amount|value|coupons|rate|₹|%/i;
    const metadataKeywords = /^(hsn|sac|fsn)[:\s]/i;
    const warrantyKeyword = /warranty:/i;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      
      // STEP 3: Apply strict filtering
      // Skip if contains table header keywords
      if (tableHeaderKeywords.test(line)) {
        console.log(`   [Flipkart Product] Skipping table header: "${line.substring(0, 40)}..."`);
        continue;
      }
      
      // Skip if contains currency symbol ₹
      if (line.includes('₹')) {
        continue;
      }
      
      // Skip if contains percentage %
      if (line.includes('%')) {
        continue;
      }
      
      // Skip if it's just numbers
      if (/^\d+$/.test(line)) {
        continue;
      }
      
      // Skip if starts with metadata
      if (metadataKeywords.test(line)) {
        continue;
      }
      
      // Skip if contains warranty
      if (warrantyKeyword.test(line)) {
        continue;
      }
      
      // Skip if too short
      if (line.length < 10) {
        continue;
      }
      
      // STEP 4: Check if this is a category line (before actual product)
      // Category lines are usually short descriptions like "Electric Jug (heater)"
      // Product lines are longer and more specific
      const isCategoryLine = line.length < 40 && /\(.*\)/.test(line);
      if (isCategoryLine && i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        // Check if next line is the actual product (longer, no symbols)
        if (nextLine.length > line.length && 
            !tableHeaderKeywords.test(nextLine) &&
            !nextLine.includes('₹') &&
            nextLine.length >= 10) {
          console.log(`   [Flipkart Product] Found category line: "${line}"`);
          console.log(`   [Flipkart Product] Using next line as product: "${nextLine}"`);
          return this.cleanFlipkartProductName(nextLine);
        }
      }
      
      // STEP 5: This line passed all filters - it's likely the product
      console.log(`   [Flipkart Product] Candidate found: "${line}"`);
      
      // STEP 6: Final safety validation
      const cleanedProduct = this.cleanFlipkartProductName(line);
      if (this.isValidFlipkartProduct(cleanedProduct)) {
        console.log(`   [Flipkart Product] ✓ Validated: "${cleanedProduct}"`);
        return cleanedProduct;
      } else {
        console.log(`   [Flipkart Product] ✗ Failed validation: "${cleanedProduct}"`);
      }
    }
    
    console.log('   [Flipkart Product] No valid product found, using fallback');
    // Fallback to generic extraction
    return this.extractProductName(text);
  }

  /**
   * Clean Flipkart product name
   * @param {string} productName - Raw product name
   * @returns {string} Cleaned product name
   */
  cleanFlipkartProductName(productName) {
    let cleaned = productName;
    
    // Remove trailing numbers and prices (from table columns)
    cleaned = cleaned.replace(/\s+\d{1,2}\s+[\d\.,\s]+$/g, '');
    
    // Remove product codes in parentheses
    cleaned = cleaned.replace(/\s*\(\s*[A-Z0-9]+\s*\)\s*$/gi, ' ');
    
    // Remove multiple spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }

  /**
   * Validate if extracted text is a valid Flipkart product name
   * @param {string} productName - Product name to validate
   * @returns {boolean} Is valid
   */
  isValidFlipkartProduct(productName) {
    if (!productName || productName.length < 10) {
      return false;
    }
    
    // FINAL SAFETY VALIDATION: Reject if contains table header terms
    const invalidTerms = ['amount', 'tax', 'value', 'utgst', 'cgst', 'sgst', 'igst', 
                          'total', 'discount', 'gross', 'taxable', 'coupons', 'qty'];
    
    const lowerProduct = productName.toLowerCase();
    for (const term of invalidTerms) {
      if (lowerProduct.includes(term)) {
        console.log(`   [Validation] Rejected: contains "${term}"`);
        return false;
      }
    }
    
    // Must not contain currency symbols
    if (productName.includes('₹') || productName.includes('₹')) {
      console.log('   [Validation] Rejected: contains currency symbol');
      return false;
    }
    
    // Must not be all caps header
    if (productName === productName.toUpperCase() && productName.length < 30) {
      console.log('   [Validation] Rejected: all caps header');
      return false;
    }
    
    return true;
  }

  /**
   * Validate extracted data
   * @param {Object} data - Extracted invoice data
   * @returns {boolean} Is valid
   */
  validateExtractedData(data) {
    console.log('\n✅ Validating extracted data...');
    
    const issues = [];
    
    // Product name validation
    if (!data.detectedProductName) {
      issues.push('Missing product name');
    } else if (data.detectedProductName.length < 5) {
      issues.push('Product name too short');
    } else if (/^(tax invoice|bill|page|original)/i.test(data.detectedProductName)) {
      issues.push('Product name is a document header');
    }
    
    // Price validation
    if (!data.detectedAmount ||data.detectedAmount <= 0) {
      issues.push('Invalid or missing price');
    } else if (data.detectedAmount < 10) {
      issues.push('Price too low (likely quantity)');
    }
    
    // Order ID validation
    if (!data.detectedOrderId) {
      issues.push('Missing order ID');
    } else if (data.platform === 'flipkart' && data.detectedOrderId.length !== 20) {
      issues.push('Flipkart Order ID must be 20 characters');
    } else if (data.platform === 'amazon' && !/\d{3}-\d{7,10}-\d{7,10}/.test(data.detectedOrderId)) {
      issues.push('Amazon Order Number format invalid');
    }
    
    // Vendor validation
    if (data.detectedVendor && /^(tax invoice|invoice|bill)/i.test(data.detectedVendor)) {
      issues.push('Vendor is a document header');
      data.detectedVendor = null;
    }
    
    if (issues.length > 0) {
      console.log('   ⚠️ Validation issues found:');
      issues.forEach(issue => console.log(`      - ${issue}`));
      return false;
    }
    
    console.log('   ✓ All validations passed');
    return true;
  }

  /**
   * Extract generic invoice data (fallback)
   * @param {string} text - Raw invoice text
   * @returns {Object} Extracted data
   */
  extractGenericData(text) {
    console.log('⚪ Using generic extraction...');
    
    const vendor = this.extractVendor(text);
    
    return {
      platform: 'generic',
      detectedOrderId: this.extractOrderId(text),
      detectedInvoiceNumber: null,
      detectedOrderDate: null,
      detectedInvoiceDate: null,
      detectedPurchaseDate: this.extractDate(text),
      detectedProductName: this.extractProductName(text),
      detectedAmount: this.extractAmount(text),
      detectedVendor: vendor,
      detectedRetailer: vendor, // Same as vendor for generic
      detectedHSN: this.extractHSN(text),
      detectedFSN: this.extractFSN(text),
    };
  }

  /**
   * Parse extracted text to find invoice data with platform-specific logic
   * @param {string} rawText - Extracted text from invoice
   * @returns {Object} Parsed invoice data
   */
  parseInvoiceText(rawText) {
    console.log('=== OCR RAW TEXT ===');
    console.log(rawText);
    console.log('=== END RAW TEXT ===\n');

    // STEP 2: Clean OCR Text
    const cleanedText = this.advancedTextCleaning(rawText);

    // STEP 1: Detect Platform
    const platform = this.detectPlatform(cleanedText);
    console.log(`🎯 Detected Platform: ${platform.toUpperCase()}\n`);

    let result;

    // Use Platform-Specific Parser
    try {
      if (platform === 'amazon') {
        result = this.extractAmazonData(cleanedText);
      } else if (platform === 'flipkart') {
        result = this.extractFlipkartData(cleanedText);
      } else {
        result = this.extractGenericData(cleanedText);
      }
    } catch (error) {
      console.error('❌ Platform parser failed:', error.message);
      console.log('   Falling back to generic extraction...');
      result = this.extractGenericData(cleanedText);
    }

    // STEP 6: Validation Layer
    const isValid = this.validateExtractedData(result);
    
    if (!isValid && platform !== 'generic') {
      console.log('⚠️ Validation failed - falling back to generic extraction...\n');
      result = this.extractGenericData(cleanedText);
      
      // Try validation again
      const genericValid = this.validateExtractedData(result);
      if (!genericValid) {
        console.log('⚠️ Generic extraction also has issues - returning best effort\n');
      }
    }

    // Log final results
    console.log('\n📊 FINAL EXTRACTION RESULTS:');
    console.log('   Platform:', result.platform);
    console.log('   Order ID:', result.detectedOrderId || 'N/A');
    console.log('   Invoice Number:', result.detectedInvoiceNumber || 'N/A');
    console.log('   Purchase Date:', result.detectedPurchaseDate || result.detectedOrderDate || 'N/A');
    console.log('   Retailer:', result.detectedRetailer || result.detectedVendor || 'N/A');
    console.log('   Product:', result.detectedProductName || 'N/A');
    console.log('   Amount:', result.detectedAmount ? `₹${result.detectedAmount}` : 'N/A');
    console.log('   HSN:', result.detectedHSN || 'N/A');
    if (result.detectedFSN) console.log('   FSN:', result.detectedFSN);
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
