/**
 * Flipkart Invoice Extractor
 * Extracts data from Flipkart invoices using platform-specific patterns
 */

const priceExtractor = require('./priceExtractor');

class FlipkartExtractor {
  /**
   * Extract data from Flipkart invoice
   * @param {string} text - Invoice text
   * @returns {Object} Extracted data
   */
  extract(text) {
    console.log('\n[Flipkart] Starting extraction...');

    const data = {
      platform: 'flipkart',
      productName: null,
      orderId: null,
      invoiceNumber: null,
      invoiceDate: null,
      orderDate: null,
      price: null,
      retailer: null,
      vendor: null,
      hsn: null,
      extractionDetails: {}
    };

    // Extract Order ID (Flipkart format: OD123456789012)
    data.orderId = this.extractOrderId(text);

    // Extract Invoice Number
    data.invoiceNumber = this.extractInvoiceNumber(text);

    // Extract Dates
    const dates = this.extractDates(text);
    data.orderDate = dates.orderDate;
    data.invoiceDate = dates.invoiceDate;

    // Extract Product Title
    data.productName = this.extractProductTitle(text);

    // Extract Price (using centralized extractor)
    data.price = priceExtractor.extract(text, 'flipkart');

    // Extract Retailer/Vendor
    const vendor = this.extractRetailer(text);
    data.retailer = vendor;
    data.vendor = vendor;

    // Extract HSN/SAC
    data.hsn = this.extractHSN(text);

    // Log extraction summary
    this.logExtractionSummary(data);

    return data;
  }

  /**
   * Extract Flipkart order ID
   * @param {string} text - Invoice text
   * @returns {string|null} Order ID
   */
  extractOrderId(text) {
    // Pattern: OD123456789012
    const match = text.match(/Order\s*(?:ID|Number)[:\s]*(OD\d{12})/i);
    if (match) {
      console.log(`[Flipkart] Order ID: ${match[1]}`);
      return match[1];
    }

    console.log('[Flipkart] ⚠️  Order ID not found');
    return null;
  }

  /**
   * Extract invoice number
   * @param {string} text - Invoice text
   * @returns {string|null} Invoice number
   */
  extractInvoiceNumber(text) {
    const match = text.match(/Invoice\s*Number[:\s]*([A-Z0-9\-\/]+)/i);
    if (match && match[1].length >= 5) {
      console.log(`[Flipkart] Invoice Number: ${match[1]}`);
      return match[1];
    }

    console.log('[Flipkart] ⚠️  Invoice Number not found');
    return null;
  }

  /**
   * Extract dates (order date and invoice date)
   * @param {string} text - Invoice text
   * @returns {Object} Dates
   */
  extractDates(text) {
    const dates = { orderDate: null, invoiceDate: null };

    // Order Date
    let match = text.match(/Order\s*Date[:\s]*([0-9.\-\/]{8,12})/i);
    if (match) {
      dates.orderDate = this.normalizeDate(match[1]);
      console.log(`[Flipkart] Order Date: ${dates.orderDate}`);
    }

    // Invoice Date
    match = text.match(/Invoice\s*Date[:\s]*([0-9.\-\/]{8,12})/i);
    if (match) {
      dates.invoiceDate = this.normalizeDate(match[1]);
      console.log(`[Flipkart] Invoice Date: ${dates.invoiceDate}`);
    }

    if (!dates.orderDate && !dates.invoiceDate) {
      console.log('[Flipkart] ⚠️  No dates found');
    }

    return dates;
  }

  /**
   * Normalize date to YYYY-MM-DD
   * @param {string} dateStr - Date string
   * @returns {string|null} Normalized date
   */
  normalizeDate(dateStr) {
    if (!dateStr) return null;

    try {
      // DD.MM.YYYY
      let match = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
      if (match) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = parseInt(match[3]);
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }

      // DD-MM-YYYY or DD/MM/YYYY
      match = dateStr.match(/(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{4})/);
      if (match) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = parseInt(match[3]);
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
    } catch (error) {
      console.log('[Flipkart] Date parsing error:', error.message);
    }

    return null;
  }

  /**
   * Extract product title
   * @param {string} text - Invoice text
   * @returns {string|null} Product title
   */
  extractProductTitle(text) {
    // Strategy: Look for "Title:" label or first product row
    let match = text.match(/Title[:\s]+([A-Za-z][A-Za-z0-9\s,\-\.\(\)]{10,200}?)(?=\s*(?:HSN|SAC|₹|\d{2,}|Qty))/i);
    
    if (match) {
      let title = match[1].trim();
      title = title.replace(/\s+/g, ' ');
      
      if (title.length >= 10 && title.length <= 200) {
        console.log(`[Flipkart] Product Title: ${title.substring(0, 60)}...`);
        return title;
      }
    }

    // Fallback: Look for first row with serial number 1
    match = text.match(/\b1\s+([A-Za-z][A-Za-z0-9\s,\-\.\(\)]{10,200}?)(?=\s*(?:₹|\d{2,}|HSN|SAC))/i);
    if (match) {
      let title = match[1].trim().replace(/\s+/g, ' ');
      if (title.length >= 10 && title.length <= 200) {
        console.log(`[Flipkart] Product Title (fallback): ${title.substring(0, 60)}...`);
        return title;
      }
    }

    console.log('[Flipkart] ⚠️  Product Title not found');
    return null;
  }

  /**
   * Extract retailer/vendor name
   * @param {string} text - Invoice text
   * @returns {string|null} Retailer name
   */
  extractRetailer(text) {
    // Try "Sold By:"
    let match = text.match(/Sold\s*By[:\s]*([A-Za-z0-9\s\-\.&,]+?)(?:\s*,|\n|Address|GSTIN|State|Pin)/i);
    if (match) {
      const retailer = match[1].trim().replace(/\s+/g, ' ');
      console.log(`[Flipkart] Retailer: ${retailer}`);
      return retailer;
    }

    // Try "Retailer:"
    match = text.match(/Retailer[:\s]*([A-Za-z0-9\s\-\.&,]+?)(?:\s*,|\n|Address|GSTIN|State|Pin)/i);
    if (match) {
      const retailer = match[1].trim().replace(/\s+/g, ' ');
      console.log(`[Flipkart] Retailer: ${retailer}`);
      return retailer;
    }

    console.log('[Flipkart] ⚠️  Retailer not found');
    return null;
  }

  /**
   * Extract HSN/SAC code
   * @param {string} text - Invoice text
   * @returns {string|null} HSN/SAC code
   */
  extractHSN(text) {
    // Try HSN
    let match = text.match(/HSN[:\s]*(\d{4,10})/i);
    if (match) {
      console.log(`[Flipkart] HSN: ${match[1]}`);
      return match[1];
    }

    // Try SAC
    match = text.match(/SAC[:\s]*(\d{4,10})/i);
    if (match) {
      console.log(`[Flipkart] SAC: ${match[1]}`);
      return match[1];
    }

    console.log('[Flipkart] ⚠️  HSN/SAC not found');
    return null;
  }

  /**
   * Log extraction summary
   * @param {Object} data - Extracted data
   */
  logExtractionSummary(data) {
    console.log('\n[Flipkart] Extraction Summary:');
    console.log(`  Order ID: ${data.orderId || 'NOT FOUND'}`);
    console.log(`  Product: ${data.productName ? data.productName.substring(0, 50) + '...' : 'NOT FOUND'}`);
    console.log(`  Price: ${data.price ? '₹' + data.price : 'NOT FOUND'}`);
    console.log(`  Date: ${data.orderDate || data.invoiceDate || 'NOT FOUND'}`);
    console.log(`  Retailer: ${data.retailer || 'NOT FOUND'}`);
    console.log(`  HSN/SAC: ${data.hsn || 'NOT FOUND'}\n`);
  }
}

module.exports = new FlipkartExtractor();
