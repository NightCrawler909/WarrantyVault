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
   * @param {string} pdfPath - Path to PDF file
   * @returns {Promise<Object>} Processing result with method used
   */
  async processPDF(pdfPath) {
    try {
      console.log('\n📋 Smart PDF Processing...');
      
      // Step 1: Try direct text extraction
      console.log('Step 1: Attempting direct text extraction...');
      const extractResult = await this.extractTextFromPDF(pdfPath);
      
      // Step 2: Check if PDF has sufficient embedded text
      if (extractResult.hasEmbeddedText) {
        console.log('✅ PDF contains embedded text (digital PDF)');
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
