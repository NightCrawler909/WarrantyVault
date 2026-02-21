/**
 * Python AI Microservice Client
 * Handles communication with FastAPI-based OCR and structured extraction service
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class PythonAIService {
  constructor() {
    this.baseURL = process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000';
    this.timeout = 60000; // 60 second timeout
  }

  /**
   * Check if Python AI service is available
   * @returns {Promise<boolean>}
   */
  async isServiceAvailable() {
    try {
      const response = await axios.get(`${this.baseURL}/`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      console.warn('⚠️ Python AI service not available:', error.message);
      return false;
    }
  }

  /**
   * Extract text from invoice using PaddleOCR
   * @param {string} filePath - Path to invoice file (PDF/JPG/PNG)
   * @returns {Promise<{text: string, confidence: number}>}
   */
  async extractText(filePath) {
    try {
      console.log('🐍 Calling Python AI service for OCR...');
      
      // Create form data
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));

      // Call Python service
      const response = await axios.post(
        `${this.baseURL}/extract-text`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: this.timeout,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      );

      if (response.status === 200 && response.data) {
        const { text, confidence } = response.data;
        console.log(`✅ Python OCR completed - Confidence: ${(confidence * 100).toFixed(1)}%`);
        
        return {
          text: text || '',
          confidence: confidence || 0,
        };
      }

      throw new Error('Invalid response from Python AI service');
    } catch (error) {
      console.error('❌ Python AI service error:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Python AI service is not running. Please start it with: python ai-service/app.py');
      }
      
      throw new Error(`Python OCR failed: ${error.message}`);
    }
  }

  /**
   * Extract structured invoice data using AI (Donut model)
   * Used as fallback when deterministic parsing fails
   * @param {string} filePath - Path to invoice file
   * @returns {Promise<Object>} Structured invoice data
   */
  async extractStructuredData(filePath) {
    try {
      console.log('🤖 Calling Python AI service for structured extraction (Donut model)...');
      
      // Create form data
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));

      // Call Python service
      const response = await axios.post(
        `${this.baseURL}/ai-structured-extract`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: this.timeout,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      );

      if (response.status === 200 && response.data) {
        console.log('✅ AI structured extraction completed');
        
        return {
          productName: response.data.product_name || '',
          orderId: response.data.order_id || '',
          invoiceNumber: response.data.invoice_number || '',
          totalAmount: response.data.total_amount || '',
          purchaseDate: response.data.purchase_date || '',
          retailer: response.data.retailer || '',
        };
      }

      throw new Error('Invalid response from Python AI service');
    } catch (error) {
      console.error('❌ AI structured extraction error:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Python AI service is not running. Please start it with: python ai-service/app.py');
      }
      
      throw new Error(`AI extraction failed: ${error.message}`);
    }
  }
}

module.exports = new PythonAIService();
