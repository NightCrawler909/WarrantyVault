/**
 * Invoice Processor
 * Main orchestrator for invoice extraction pipeline
 * Coordinates: PDF extraction → Platform detection → Page classification → Data extraction
 */

const pdfService = require('./pdfService');
const platformDetector = require('./platformDetector');
const pageClassifier = require('./pageClassifier');
const amazonExtractor = require('./amazonExtractor');
const flipkartExtractor = require('./flipkartExtractor');

class InvoiceProcessor {
  /**
   * Process invoice from extracted text or file path
   * @param {string|Object} input - Extracted text string, or object with {text, pages} or file path
   * @returns {Promise<Object>} Extracted invoice data
   */
  async process(input) {
    console.log('\n============================================');
    console.log('📄 INVOICE PROCESSING PIPELINE');
    console.log('============================================\n');

    try {
      let pages = [];
      let selectedText = '';
      
      // Handle different input types
      if (typeof input === 'string') {
        // Input is either a file path or direct text
        // Try to detect if it's a file path
        if (input.includes('\\') || input.includes('/') || input.includes('.pdf')) {
          // STEP 1: Extract pages from PDF file
          console.log('STEP 1: Extracting pages from PDF...');
          pages = await pdfService.extractTextPerPage(input);
          console.log(`✅ Extracted ${pages.length} page(s)\n`);
        } else {
          // Direct text input
          console.log('STEP 1: Using provided text...');
          pages = [input];
          selectedText = input;
          console.log('✅ Text provided directly\n');
        }
      } else if (input.pages && Array.isArray(input.pages)) {
        // Input is an object with pages array
        console.log('STEP 1: Using provided pages...');
        pages = input.pages;
        console.log(`✅ ${pages.length} page(s) provided\n`);
      } else if (input.text) {
        // Input is an object with text
        console.log('STEP 1: Using provided text...');
        pages = [input.text];
        selectedText = input.text;
        console.log('✅ Text provided directly\n');
      } else {
        throw new Error('Invalid input: expected file path, text string, or {text/pages} object');
      }

      if (!pages || pages.length === 0) {
        throw new Error('No text could be extracted or provided');
      }

      // STEP 2: Detect platform (use first page for initial detection)
      console.log('STEP 2: Detecting platform...');
      const firstPageText = pages[0];
      const detectedPlatform = platformDetector.detect(firstPageText);
      const platformConfidence = platformDetector.getConfidence(firstPageText, detectedPlatform);
      console.log(`✅ Platform: ${detectedPlatform.toUpperCase()} (confidence: ${platformConfidence}%)\n`);

      if (detectedPlatform === 'unknown') {
        console.log('⚠️  Platform unknown - will attempt generic extraction');
      }

      // STEP 3: Classify and select best page (for multi-page PDFs)
      console.log('STEP 3: Classifying pages...');
      
      if (!selectedText) {
        // Only classify if we haven't already selected text
        if (pages.length > 1) {
          const classifiedPages = pageClassifier.classifyPages(pages);
          const bestPage = pageClassifier.selectBestPage(classifiedPages);
          selectedText = bestPage.text;
          console.log(`✅ Selected page ${bestPage.pageNumber} (score: ${bestPage.score})\n`);
        } else {
          selectedText = pages[0];
          console.log('✅ Single page - using as-is\n');
        }
      } else {
        console.log('✅ Text already selected\n');
      }

      // STEP 4: Run platform-specific extraction
      console.log('STEP 4: Running platform-specific extraction...');
      let extractedData;

      if (detectedPlatform === 'amazon') {
        extractedData = amazonExtractor.extract(selectedText);
      } else if (detectedPlatform === 'flipkart') {
        extractedData = flipkartExtractor.extract(selectedText);
      } else {
        // Unknown platform - attempt generic extraction
        extractedData = this.genericExtraction(selectedText);
      }

      // STEP 5: Calculate confidence score
      console.log('STEP 5: Calculating confidence score...');
      const confidenceScore = this.calculateConfidence(extractedData, platformConfidence);
      extractedData.confidenceScore = confidenceScore;
      console.log(`✅ Overall confidence: ${confidenceScore}%\n`);

      // STEP 6: Format and return result
      const result = this.formatResult(extractedData);

      console.log('============================================');
      console.log('✅ INVOICE PROCESSING COMPLETE');
      console.log('============================================\n');

      return result;

    } catch (error) {
      console.error('\n❌ INVOICE PROCESSING FAILED');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      
      throw error;
    }
  }

  /**
   * Calculate overall confidence score
   * @param {Object} data - Extracted data
   * @param {number} platformConfidence - Platform detection confidence
   * @returns {number} Confidence score (0-100)
   */
  calculateConfidence(data, platformConfidence) {
    let score = 0;
    let maxScore = 0;

    // Field scoring (20 points each)
    const fields = [
      { key: 'productName', minLength: 10 },
      { key: 'orderId', minLength: 5 },
      { key: 'price', minValue: 10 },
      { key: 'invoiceDate', required: true },
      { key: 'retailer', minLength: 3 },
      { key: 'hsn', minLength: 4 }
    ];

    fields.forEach(field => {
      maxScore += 20;
      const value = data[field.key];

      if (value) {
        if (field.minLength && typeof value === 'string' && value.length >= field.minLength) {
          score += 20;
        } else if (field.minValue && typeof value === 'number' && value >= field.minValue) {
          score += 20;
        } else if (field.required) {
          score += 20;
        }
      }
    });

    // Platform confidence bonus (up to 10% of max score)
    const platformBonus = (platformConfidence / 100) * maxScore * 0.1;
    score += platformBonus;

    // Calculate percentage (cap at 100)
    const confidence = Math.min(100, Math.round((score / maxScore) * 100));
    
    console.log(`[Confidence] Field score: ${score}/${maxScore}`);
    console.log(`[Confidence] Platform bonus: +${platformBonus.toFixed(1)}`);
    
    return confidence;
  }

  /**
   * Generic extraction (for unknown platforms)
   * @param {string} text - Invoice text
   * @returns {Object} Extracted data
   */
  genericExtraction(text) {
    console.log('\n[Generic] Attempting generic extraction...');
    
    return {
      platform: 'unknown',
      productName: null,
      orderId: null,
      invoiceNumber: null,
      invoiceDate: null,
      orderDate: null,
      price: null,
      retailer: null,
      vendor: null,
      hsn: null,
      extractionDetails: {
        message: 'Platform could not be detected - manual review required'
      }
    };
  }

  /**
   * Format result to standard output structure
   * @param {Object} data - Extracted data
   * @returns {Object} Formatted result
   */
  formatResult(data) {
    return {
      platform: data.platform || 'unknown',
      productName: data.productName || '',
      orderId: data.orderId || '',
      invoiceNumber: data.invoiceNumber || '',
      invoiceDate: data.invoiceDate || data.orderDate || '',
      orderDate: data.orderDate || '',
      price: data.price || '',
      retailer: data.retailer || data.vendor || '',
      vendor: data.vendor || data.retailer || '',
      hsn: data.hsn || '',
      confidenceScore: data.confidenceScore || 0,
      extractionDetails: data.extractionDetails || {}
    };
  }
}

module.exports = new InvoiceProcessor();
