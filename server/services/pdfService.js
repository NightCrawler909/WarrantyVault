const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const { fromPath } = require('pdf2pic');

class PDFService {
  constructor() {
    // Ensure temp directory exists
    this.tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Extract text directly from PDF (for text-based PDFs)
   * @param {string} pdfPath - Path to PDF file
   * @returns {Promise<Object>} Extracted text and metadata
   */
  async extractTextFromPDF(pdfPath) {
    try {
      if (!fs.existsSync(pdfPath)) {
        throw new Error('PDF file not found');
      }

      // Read PDF file
      const dataBuffer = fs.readFileSync(pdfPath);
      
      // Create PDFParse instance with the PDF data
      const parser = new PDFParse({ data: dataBuffer });
      
      // Extract text from PDF
      const result = await parser.getText();
      
      console.log(`📄 PDF text extracted: ${result.text.length} characters`);
      
      // Return both text and length for quality detection
      return {
        text: result.text,
        length: result.text.length,
        hasEmbeddedText: result.text.length > 200, // Threshold for embedded text
      };
    } catch (error) {
      console.error('PDF text extraction error:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * Extract text per page from PDF (for multi-page analysis)
   * @param {string} pdfPath - Path to PDF file
   * @returns {Promise<Array>} Array of page objects with text and metadata
   */
  async extractTextPerPage(pdfPath) {
    try {
      if (!fs.existsSync(pdfPath)) {
        throw new Error('PDF file not found');
      }

      const dataBuffer = fs.readFileSync(pdfPath);
      const pages = [];
      let pageTexts = [];

      // Use pdf-parse with page rendering function
      await new PDFParse({ data: dataBuffer }).getText({
        pagerender: function(pageData) {
          return pageData.getTextContent().then(function(textContent) {
            let pageText = '';
            textContent.items.forEach(function(item) {
              pageText += item.str + ' ';
            });
            pageTexts.push(pageText.trim());
          });
        }
      });

      // Build page objects
      for (let i = 0; i < pageTexts.length; i++) {
        pages.push({
          pageIndex: i + 1,
          text: pageTexts[i],
          length: pageTexts[i].length
        });
      }

      console.log(`📄 Extracted text from ${pages.length} pages`);
      
      return pages;
    } catch (error) {
      console.error('Per-page text extraction error:', error);
      throw new Error(`Failed to extract text per page: ${error.message}`);
    }
  }

  /**
   * Classify page type (service/COD vs product invoice)
   * @param {string} text - Page text
   * @returns {string} 'service', 'product', or 'unknown'
   */
  classifyPageType(text) {
    const lowerText = text.toLowerCase();
    
    // SERVICE PAGE INDICATORS
    const serviceIndicators = [
      lowerText.includes('service accounting code'),
      lowerText.includes('cash on delivery'),
      /\bcod\b/i.test(text),
      lowerText.includes('amount in words: seven only'),
      lowerText.includes('amount in words: eight only'),
      lowerText.includes('amount in words: nine only'),
      lowerText.includes('amount in words: ten only'),
      lowerText.includes('delivery charges'),
      lowerText.includes('cod fee'),
      lowerText.includes('service fee')
    ];
    
    // Check for very small TOTAL (< 50) - likely service fee
    const totalMatch = text.match(/TOTAL[:\s]*₹?\s*([0-9.,]+)/i);
    if (totalMatch) {
      const amount = parseFloat(totalMatch[1].replace(/,/g, ''));
      if (!isNaN(amount) && amount < 50) {
        serviceIndicators.push(true);
      }
    }
    
    const serviceScore = serviceIndicators.filter(Boolean).length;
    
    // PRODUCT PAGE INDICATORS
    const productIndicators = [
      /hsn[:\s]*\d{8}/i.test(text), // 8-digit HSN
      /B0[A-Z0-9]{8}/.test(text), // Amazon ASIN
      lowerText.includes('unit price'),
      lowerText.includes('qty'),
      lowerText.includes('description'),
      text.match(/\b1\s+[A-Za-z]{30,}/) !== null, // Long product description
      lowerText.includes('product'),
      lowerText.includes('item')
    ];
    
    const productScore = productIndicators.filter(Boolean).length;
    
    // Classification logic
    if (serviceScore >= 2) {
      return 'service';
    }
    
    if (productScore >= 3) {
      return 'product';
    }
    
    // If has high total amount, likely product
    if (totalMatch) {
      const amount = parseFloat(totalMatch[1].replace(/,/g, ''));
      if (!isNaN(amount) && amount >= 100) {
        return 'product';
      }
    }
    
    return 'unknown';
  }

  /**
   * Analyze pages with robust scoring system (for multi-page invoice selection)
   * @param {Array} pages - Array of page objects with text
   * @returns {Array} Pages with scores and detected total amounts
   */
  analyzePages(pages) {
    const analyzedPages = [];

    for (const page of pages) {
      let score = 0;
      const lowerText = page.text.toLowerCase();
      
      // STEP 1: Apply NEGATIVE scores for service/COD indicators
      if (lowerText.includes('service accounting code')) {
        score -= 50;
        console.log(`   [Page ${page.pageIndex}] -50: Service Accounting Code`);
      }
      if (lowerText.includes('cash on delivery') || lowerText.includes('pay on delivery')) {
        score -= 50;
        console.log(`   [Page ${page.pageIndex}] -50: Cash/Pay on Delivery`);
      }
      if (/\bcod\b/i.test(page.text)) {
        score -= 50;
        console.log(`   [Page ${page.pageIndex}] -50: COD`);
      }
      if (lowerText.includes('amount in words: seven only') || 
          lowerText.includes('amount in words: eight only') ||
          lowerText.includes('amount in words: nine only') ||
          lowerText.includes('amount in words: ten only')) {
        score -= 50;
        console.log(`   [Page ${page.pageIndex}] -50: Small amount in words`);
      }
      
      // STEP 2: Apply POSITIVE scores for product indicators
      if (/hsn[:\s]*\d{8}/i.test(page.text)) {
        score += 20;
        console.log(`   [Page ${page.pageIndex}] +20: HSN (8 digits)`);
      }
      if (lowerText.includes('unit price')) {
        score += 20;
        console.log(`   [Page ${page.pageIndex}] +20: Unit Price column`);
      }
      if (lowerText.includes('qty')) {
        score += 20;
        console.log(`   [Page ${page.pageIndex}] +20: Qty column`);
      }
      
      // Check for long product description (> 40 chars)
      const descMatch = page.text.match(/\b1\s+([A-Za-z0-9\s]{40,})/);
      if (descMatch) {
        score += 30;
        console.log(`   [Page ${page.pageIndex}] +30: Long product description`);
      }
      
      // Check for Amazon ASIN
      if (/B0[A-Z0-9]{8}/.test(page.text)) {
        score += 30;
        console.log(`   [Page ${page.pageIndex}] +30: Amazon ASIN`);
      }
      
      // STEP 3: Extract ALL totals and find largest
      const totalMatches = [...page.text.matchAll(/TOTAL[:\s]*₹?\s*([0-9.,]+)/gi)];
      let maxTotal = 0;
      
      totalMatches.forEach(match => {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(amount) && amount > 0) {
          if (amount > maxTotal) {
            maxTotal = amount;
          }
        }
      });
      
      // Also check Grand Total
      const grandTotalMatches = [...page.text.matchAll(/Grand\s*Total[:\s]*₹?\s*([0-9.,]+)/gi)];
      grandTotalMatches.forEach(match => {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(amount) && amount > 0) {
          if (amount > maxTotal) {
            maxTotal = amount;
          }
        }
      });
      
      // STEP 4: Apply score modifiers based on total amount
      if (maxTotal > 100) {
        score += 40;
        console.log(`   [Page ${page.pageIndex}] +40: Total > ₹100 (₹${maxTotal})`);
      } else if (maxTotal > 0 && maxTotal < 50) {
        score -= 30;
        console.log(`   [Page ${page.pageIndex}] -30: Total < ₹50 (₹${maxTotal})`);
      }
      
      const analysis = {
        pageIndex: page.pageIndex,
        text: page.text,
        score: score,
        maxTotal: maxTotal,
        totalAmount: maxTotal, // For backward compatibility
        pageType: score < 0 ? 'service' : (score > 50 ? 'product' : 'unknown'),
        hasProductIndicators: score > 0
      };

      analyzedPages.push(analysis);
    }

    return analyzedPages;
  }

  /**
   * Select best page from multi-page PDF (robust scoring-based selection)
   * @param {Array} analyzedPages - Pages with analysis
   * @returns {Object} Best page
   */
  selectBestPage(analyzedPages) {
    if (!analyzedPages || analyzedPages.length === 0) {
      return null;
    }

    // DEBUG LOGGING: Show all page scores
    console.log(`\n📊 PAGE SCORES:`, analyzedPages.map(p => ({
      index: p.pageIndex,
      score: p.score,
      maxTotal: p.maxTotal,
      type: p.pageType
    })));

    console.log(`\n📋 Detailed Multi-page Analysis:`);
    analyzedPages.forEach(page => {
      const emoji = page.pageType === 'service' ? '🚫' : (page.pageType === 'product' ? '✅' : '❓');
      console.log(`${emoji} Page ${page.pageIndex}: Score=${page.score}, Total=₹${page.maxTotal || 'N/A'}, Type=${page.pageType.toUpperCase()}`);
    });

    // STEP 1: Sort by score (highest first)
    const sortedByScore = [...analyzedPages].sort((a, b) => b.score - a.score);
    
    // STEP 2: If top scores are tied, use maxTotal as tiebreaker
    const topScore = sortedByScore[0].score;
    const topPages = sortedByScore.filter(p => p.score === topScore);
    
    let bestPage;
    if (topPages.length > 1) {
      console.log(`\n⚖️  TIE detected (${topPages.length} pages with score ${topScore})`);
      console.log('   Using maxTotal as tiebreaker...');
      bestPage = topPages.sort((a, b) => b.maxTotal - a.maxTotal)[0];
    } else {
      bestPage = sortedByScore[0];
    }

    console.log(`\n✅ SELECTED: Page ${bestPage.pageIndex} (Score: ${bestPage.score}, Total: ₹${bestPage.maxTotal || 'N/A'}, Type: ${bestPage.pageType.toUpperCase()})\n`);

    return bestPage;
  }

  /**
   * Convert PDF to high-quality PNG image for OCR
   * @param {string} pdfPath - Path to PDF file
   * @param {Object} options - Conversion options
   * @returns {Promise<string>} Path to generated PNG image
   */
  async convertPDFToImage(pdfPath, options = {}) {
    try {
      const {
        dpi = 400, // High DPI for better OCR accuracy
        format = 'png',
        page = 1, // First page only
        width = null,
        height = null,
      } = options;

      console.log(`🔄 Converting PDF to image at ${dpi} DPI...`);

      // Configure pdf2pic for high-quality conversion
      const converter = fromPath(pdfPath, {
        density: dpi, // DPI setting
        saveFilename: `pdf_converted_${Date.now()}`,
        savePath: this.tempDir,
        format: format,
        width: width,
        height: height,
        quality: 100, // Maximum quality
      });

      // Convert first page
      const result = await converter(page, { responseType: 'image' });
      
      const imagePath = result.path;
      
      if (!fs.existsSync(imagePath)) {
        throw new Error('PDF conversion failed - output file not created');
      }

      const fileSize = fs.statSync(imagePath).size;
      console.log(`✅ PDF converted to image: ${path.basename(imagePath)}`);
      console.log(`   Size: ${(fileSize / 1024).toFixed(2)} KB`);

      return imagePath;
    } catch (error) {
      console.error('❌ PDF to image conversion error:', error);
      throw new Error(`Failed to convert PDF to image: ${error.message}`);
    }
  }

  /**
   * Smart PDF processing - tries text extraction first, falls back to image conversion
   * Supports multi-page analysis for Amazon invoices
   * @param {string} pdfPath - Path to PDF file
   * @param {Object} options - Processing options (e.g., { platform: 'amazon' })
   * @returns {Promise<Object>} Processing result with method used
   */
  async processPDF(pdfPath, options = {}) {
    try {
      console.log('\n📋 Smart PDF Processing...');
      
      // Step 1: Try direct text extraction
      console.log('Step 1: Attempting direct text extraction...');
      const extractResult = await this.extractTextFromPDF(pdfPath);
      
      // Step 2: Check if PDF has sufficient embedded text
      if (extractResult.hasEmbeddedText) {
        console.log('✅ PDF contains embedded text (digital PDF)');
        
        // Step 2.5: For Amazon PDFs, perform multi-page analysis
        if (options.platform === 'amazon') {
          console.log('🔷 Amazon PDF detected - checking for multiple pages...');
          
          try {
            const pages = await this.extractTextPerPage(pdfPath);
            
            if (pages.length > 1) {
              console.log(`📄 Multi-page PDF detected (${pages.length} pages)`);
              console.log('   Analyzing pages to find product invoice...');
              
              const analyzedPages = this.analyzePages(pages);
              const bestPage = this.selectBestPage(analyzedPages);
              
              if (bestPage) {
                return {
                  method: 'multi_page_analysis',
                  text: bestPage.text,
                  requiresOCR: false,
                  imagePath: null,
                  selectedPage: bestPage.pageIndex,
                  totalPages: pages.length,
                  pageAnalysis: analyzedPages
                };
              }
            } else {
              console.log('   Single-page PDF - using standard extraction');
            }
          } catch (pageError) {
            console.warn('⚠️  Page-level extraction failed, using full document:', pageError.message);
            // Fall through to standard processing
          }
        }
        
        console.log('   Using direct extraction - NO OCR needed');
        return {
          method: 'direct_text_extraction',
          text: extractResult.text,
          requiresOCR: false,
          imagePath: null,
        };
      }

      // Step 3: Insufficient text - convert to image for OCR
      console.log('⚠️  Insufficient embedded text (< 200 chars)');
      console.log('   Converting to image for OCR processing...');
      
      const imagePath = await this.convertPDFToImage(pdfPath, { dpi: 400 });
      
      return {
        method: 'image_conversion',
        text: extractResult.text, // May contain partial text
        requiresOCR: true,
        imagePath: imagePath,
      };
    } catch (error) {
      console.error('❌ Smart PDF processing error:', error);
      throw new Error(`Failed to process PDF: ${error.message}`);
    }
  }

  /**
   * Check if file is a PDF
   * @param {string} filePath - Path to file
   * @returns {boolean}
   */
  isPDF(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.pdf';
  }

  /**
   * Get PDF info
   * @param {string} pdfPath - Path to PDF file
   * @returns {Promise<Object>} PDF metadata
   */
  async getPDFInfo(pdfPath) {
    try {
      const dataBuffer = fs.readFileSync(pdfPath);
      
      // Create PDFParse instance with the PDF data
      const parser = new PDFParse({ data: dataBuffer });
      
      // Get PDF info
      const info = await parser.getInfo();
      
      return {
        numPages: info.total,
        info: info.info,
        metadata: info.metadata,
      };
    } catch (error) {
      console.error('Failed to get PDF info:', error);
      return null;
    }
  }

  /**
   * Clean up temporary PDF conversion files
   * @param {string} imagePath - Path to temporary image file
   */
  cleanupTempImage(imagePath) {
    try {
      if (imagePath && fs.existsSync(imagePath)) {
        // Only delete files in temp directory
        if (imagePath.includes('/temp/') || imagePath.includes('\\temp\\')) {
          fs.unlinkSync(imagePath);
          console.log(`🗑️  Cleaned up temp PDF image: ${path.basename(imagePath)}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up temp image:', error.message);
    }
  }
}

module.exports = new PDFService();
