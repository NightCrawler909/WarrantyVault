const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

class PDFService {
  /**
   * Extract text directly from PDF (for text-based PDFs)
   * @param {string} pdfPath - Path to PDF file
   * @returns {Promise<string>} Extracted text
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
      
      console.log(`PDF text extracted: ${result.text.length} characters`);
      
      return result.text;
    } catch (error) {
      console.error('PDF text extraction error:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
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
}

module.exports = new PDFService();
