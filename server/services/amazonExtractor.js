/**
 * Amazon Invoice Extractor
 * Extracts data from Amazon invoices using platform-specific patterns
 */

const priceExtractor = require('./priceExtractor');

class AmazonExtractor {
  /**
   * Extract data from Amazon invoice
   * @param {string} text - Invoice text
   * @returns {Object} Extracted data
   */
  extract(text) {
    console.log('\n[Amazon] Starting extraction...');

    const data = {
      platform: 'amazon',
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

    // Extract Order Number (Amazon format: 123-1234567-1234567)
    data.orderId = this.extractOrderNumber(text);

    // Extract Invoice Number
    data.invoiceNumber = this.extractInvoiceNumber(text);

    // Extract Dates
    const dates = this.extractDates(text);
    data.orderDate = dates.orderDate;
    data.invoiceDate = dates.invoiceDate;

    // Extract Product Name
    data.productName = this.extractProductName(text);

    // Extract Price (using centralized extractor)
    data.price = priceExtractor.extract(text, 'amazon');

    // Extract Vendor/Retailer
    const vendor = this.extractVendor(text);
    data.vendor = vendor;
    data.retailer = vendor;

    // Extract HSN
    data.hsn = this.extractHSN(text);

    // Log extraction summary
    this.logExtractionSummary(data);

    return data;
  }

  /**
   * Extract Amazon order number
   * @param {string} text - Invoice text
   * @returns {string|null} Order number
   */
  extractOrderNumber(text) {
    // Pattern: 123-1234567-1234567
    const match = text.match(/Order\s*Number[:\s]*(\d{3}-\d{7,10}-\d{7,10})/i);
    if (match) {
      console.log(`[Amazon] Order Number: ${match[1]}`);
      return match[1];
    }

    console.log('[Amazon] ⚠️  Order Number not found');
    return null;
  }

  /**
   * Extract invoice number
   * @param {string} text - Invoice text
   * @returns {string|null} Invoice number
   */
  extractInvoiceNumber(text) {
    const match = text.match(/Invoice\s*Number[:\s]*([A-Z0-9\-]+)/i);
    if (match && match[1].length >= 5) {
      console.log(`[Amazon] Invoice Number: ${match[1]}`);
      return match[1];
    }

    console.log('[Amazon] ⚠️  Invoice Number not found');
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
      console.log(`[Amazon] Order Date: ${dates.orderDate}`);
    }

    // Invoice Date
    match = text.match(/Invoice\s*Date[:\s]*([0-9.\-\/]{8,12})/i);
    if (match) {
      dates.invoiceDate = this.normalizeDate(match[1]);
      console.log(`[Amazon] Invoice Date: ${dates.invoiceDate}`);
    }

    if (!dates.orderDate && !dates.invoiceDate) {
      console.log('[Amazon] ⚠️  No dates found');
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
      // DD.MM.YYYY (Amazon format)
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
      console.log('[Amazon] Date parsing error:', error.message);
    }

    return null;
  }

  /**
   * Extract product name
   * @param {string} text - Invoice text
   * @returns {string|null} Product name
   */
  extractProductName(text) {
    console.log('[Amazon] Attempting product name extraction...');
    
    // Strategy 1: Extract from table - looking for "Description" column content
    // Based on user logs: "Description" header is followed by content, but serial number "1" is unreliable or separate
    // The description usually starts after "Description" and before HSN or quantity/price columns
    
    // Pattern: Find "Description" and capture until HSN code
    let match = text.match(/Description\s+([A-Za-z0-9][^]*?)(?=\s*HSN:)/i);
    
    // If not found, try finding row starting with 1
    if (!match) {
       match = text.match(/\b1\s+([A-Za-z0-9][^]*?)(?=\s*HSN:)/i);
    }
    
    if (match) {
      let productName = match[1].trim();
      
      // Known garbage prefixes to remove (from table headers or previous text)
      // Example: "of 1 For RETAILEZ PRIVATE LIMITED: Authorized Signatory Order Number..."
      const garbagePrefixes = [
        /^of\s+\d+\s+For\s+[^:]+:\s+Authorized\s+Signatory/i,
        /^[^:]+:\s+Authorized\s+Signatory/i,
        /^Order\s+Number:[^]+?Invoice\s+Number:[^]+?Invoice\s+Date:[^]+?Description/i
      ];
      
      garbagePrefixes.forEach(prefix => {
        productName = productName.replace(prefix, '').trim();
      });

      // Split by known separators like newlines or pipe |
      // If we captured way too much (like previous invoice details), take the last part which is likely the product
      if (productName.length > 300 && productName.includes('Description')) {
         const parts = productName.split('Description');
         productName = parts[parts.length - 1].trim();
      }

      console.log(`[Amazon] Raw match (length ${productName.length}): ${productName.substring(0, 100)}...`);
      
      // Clean up
      productName = productName.replace(/[\r\n]+/g, ' '); // Replace newlines with space
      productName = productName.replace(/\s+/g, ' '); // Normalize whitespace
      
      // Remove ASIN patterns at the end
      productName = productName.replace(/\s*\|\s*B0[A-Z0-9]{8,10}\s*\([^)]+\)\s*$/i, ''); 
      productName = productName.replace(/\s*B0[A-Z0-9]{8,10}\s*\([^)]+\)\s*$/i, ''); 
      productName = productName.replace(/\s*\(\s*B0[A-Z0-9]{8,10}\s*\)\s*$/i, ''); 
      productName = productName.replace(/\s*\|\s*B0[A-Z0-9]{8,10}\s*$/i, ''); 
      
      // Remove "1" prefix if it was captured
      productName = productName.replace(/^1\s+/, '');

      productName = productName.trim();
      
      // Validate length
      if (productName.length >= 5 && productName.length <= 500) {
        const preview = productName.length > 80 ? productName.substring(0, 80) + '...' : productName;
        console.log(`[Amazon] Product Name: ${preview}`);
        return productName;
      }
    }
    
    // Strategy 2: Look for Description column
    match = text.match(/Description[:\s]+([A-Za-z][^]*?)(?=\s*(?:Unit\s*Price|HSN:|₹\s*[0-9]{2,3}\.))/i);
    if (match) {
      let productName = match[1].trim();
      console.log(`[Amazon] Description match: ${productName.substring(0, 100)}...`);
      
      productName = productName.replace(/\s+/g, ' ');
      productName = productName.replace(/\s*\|\s*B0[A-Z0-9]{8,10}.*$/i, '');
      productName = productName.replace(/\s*B0[A-Z0-9]{8,10}\s*\([^)]+\)\s*$/i, '');
      
      if (productName.length >= 10 && productName.length <= 500) {
        const preview = productName.length > 80 ? productName.substring(0, 80) + '...' : productName;
        console.log(`[Amazon] Product Name (from Description): ${preview}`);
        return productName;
      }
    } else {
      console.log('[Amazon] No match for pattern 2 (Description column)');
    }

    console.log('[Amazon] ⚠️  Product Name not found');
    return null;
  }

  /**
   * Extract vendor/seller name
   * @param {string} text - Invoice text
   * @returns {string|null} Vendor name
   */
  extractVendor(text) {
    const match = text.match(/Sold\s*By[:\s]*([A-Za-z0-9\s\-\.&,]+?)(?:\s*,|\n|Plot|Address|GSTIN|Phone)/i);
    if (match) {
      const vendorName = match[1].trim().replace(/\s+/g, ' ');
      console.log(`[Amazon] Vendor: ${vendorName}`);
      return vendorName;
    }

    console.log('[Amazon] ⚠️  Vendor not found');
    return null;
  }

  /**
   * Extract HSN code
   * @param {string} text - Invoice text
   * @returns {string|null} HSN code
   */
  extractHSN(text) {
    const match = text.match(/HSN[:\s]*(\d{4,10})/i);
    if (match) {
      console.log(`[Amazon] HSN: ${match[1]}`);
      return match[1];
    }

    console.log('[Amazon] ⚠️  HSN not found');
    return null;
  }

  /**
   * Log extraction summary
   * @param {Object} data - Extracted data
   */
  logExtractionSummary(data) {
    console.log('\n[Amazon] Extraction Summary:');
    console.log(`  Order ID: ${data.orderId || 'NOT FOUND'}`);
    console.log(`  Product: ${data.productName ? data.productName.substring(0, 50) + '...' : 'NOT FOUND'}`);
    console.log(`  Price: ${data.price ? '₹' + data.price : 'NOT FOUND'}`);
    console.log(`  Date: ${data.orderDate || data.invoiceDate || 'NOT FOUND'}`);
    console.log(`  Vendor: ${data.vendor || 'NOT FOUND'}`);
    console.log(`  HSN: ${data.hsn || 'NOT FOUND'}\n`);
  }
}

module.exports = new AmazonExtractor();
