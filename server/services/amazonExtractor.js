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
   * Extract product name using STRICT table parsing (User Request)
   * Focus: Avoid headers, coupons, tax rows. Get FIRST valid product.
   * @param {string} text - Invoice text
   * @returns {string|null} Product name
   */
  extractProductName(text) {
    console.log('[Amazon] Attempting STRICT product name extraction...');

    // 1. Split text into lines to preserve table structure
    const lines = text.split(/[\r\n]+/);
    
    // 2. Locate Table Header (Description/Title/Sl No)
    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        const lowerLine = lines[i].toLowerCase();
        if ((lowerLine.includes('description') && !lowerLine.includes('tax')) || 
            lowerLine.includes('particulars') ||
            (lowerLine.includes('title') && !lowerLine.includes('sub')) ||
            (lowerLine.includes('sl') && lowerLine.includes('no'))) {
            headerIndex = i;
            console.log(`[Amazon] Table header found at line ${i}: "${lines[i].trim().substring(0, 50)}..."`);
            break;
        }
    }

    // Default start if no header found (unlikely but safe)
    const startScanIndex = headerIndex !== -1 ? headerIndex + 1 : 0;
    
    // 3. Scan Next 20 Lines for First Valid Product
    // We stop as soon as we find a valid product row.
    
    for (let i = startScanIndex; i < Math.min(lines.length, startScanIndex + 25); i++) {
        let line = lines[i].trim();
        
        // --- PRE-CLEANING ---
        // Remove leading serial numbers (e.g., "1 ", "1. ")
        line = line.replace(/^[0-9]+[\.\)]?\s+/, '');
        
        const lowerLine = line.toLowerCase();
        const upperLine = line.toUpperCase(); // For strict casing checks if needed

        // --- HARD BLOCK RULES (Reject these lines immediately) ---
        // Headers/Tax/Totals/Noise
        const blockKeywords = [
            'total', 'grand total', 'sub total', 'tax', 'cgst', 'sgst', 'igst', 
            'vat', 'rate', 'discount', 'shipping', 'delivery', 'round off',
            'amount', 'net amount', 'gross amount', 'taxable value', 
            'unit price', 'quantity', 'qty', 'hsn', 'sac', 'sku',
            'invoice number', 'order number', 'sold by', 'bill to', 'ship to',
            'pickup', 'return', 'policy', 'page', 'of', 'website', 'customer',
            'coupon', 'promotion', 'saving'
        ];
        
        if (blockKeywords.some(kw => lowerLine.includes(kw))) {
             // Exception: If the line is VERY long and has "Total" inside a phrase like "Total Protection", keep it.
             // But usually safer to skip.
             continue;
        }

        // --- VALIDATION RULES ---

        // 1. Length Check (> 15 chars, ideally > 25 but some short products exist)
        if (line.length < 10) continue; 
        
        // 2. Alphabetic Check (Must have letters)
        if (!/[a-zA-Z]/.test(line)) continue;

        // 3. Word Count (At least 3 words)
        const wordCount = line.split(/\s+/).length;
        if (wordCount < 3) continue;

        // 4. Numeric Density (Reject if > 40% digits)
        const digitCount = (line.match(/\d/g) || []).length;
        if (digitCount / line.length > 0.4) continue;

        // 5. Currency Symbol Only Check (Reject "₹ 300.00")
        if (/^[₹Rs\.\s0-9]+$/.test(line)) continue;

        // --- If we passed all checks, this is likely our product ---
        
        // --- POST-CLEANING ---
        // Clean up common artifacts
        let productName = line;
        
        // Remove HSN/SAC codes if attached at end
        productName = productName.replace(/\s+(HSN|SAC|sku|asin)[:\s\-].*$/i, '');
        
        // Remove prices at the end of the string
        productName = productName.replace(/\s+₹?\s*[\d,]+\.?\d*$/i, '');
        
        // Remove Amazon specific artifacts like (B0...)
        productName = productName.replace(/\s*\(?B0[A-Z0-9]{8,10}\)?\s*$/i, '');
        productName = productName.replace(/\s*\|\s*B0[A-Z0-9]{8,10}.*$/i, '');
        
        // Final trim
        productName = productName.trim();
        
        // Double check final length
        if (productName.length < 5) continue;

        console.log(`[Amazon] Valid Product Found at line ${i}: "${productName}"`);
        return productName;
    }

    console.log('[Amazon] No valid product name found in first 20 lines after header.');
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
