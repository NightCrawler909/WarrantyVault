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
   * Extract product name using STRICT TABLE-BASED Strategy (Multi-Table Support)
   * Focus: Identifying correct product table among multiple tables (e.g. COD fees vs Product)
   * @param {string} text - Invoice text
   * @returns {string|null} Product name
   */
  extractProductName(text) {
    console.log('[Amazon] Attempting STRICT TABLE-BASED product extraction...');

    // STEP 1: Split text into potential table blocks
    // We look for table headers "Sl. No" or "Description" as split points
    // We prepend a dummy delimiter to finding the first one
    const splitPattern = /(?=(?:Sl\.?\s*No|Description|Particulars|Item\s*Name))/i;
    const rawTables = text.split(splitPattern);
    
    // Filter out very short blocks
    const tables = rawTables.filter(t => t.length > 50 && (t.toLowerCase().includes('description') || t.toLowerCase().includes('sl')));
    
    if (tables.length === 0) {
        // Fallback: Treat whole text as one table
        tables.push(text);
    }
    
    console.log(`[Amazon] Found ${tables.length} potential table blocks.`);

    // STEP 2: Score Each Table
    let bestTable = null;
    let maxScore = -999;

    tables.forEach((tableText, index) => {
        let score = 0;
        const lowerTable = tableText.toLowerCase();

        // Positive Indicators
        if (/HSN[:\s]*\d{4,8}/i.test(tableText)) score += 5;
        if (/B0[A-Z0-9]{8}/.test(tableText)) score += 4;
        // Check for long DESCRIPTION inside table (look for lines with > 40 chars)
        if (/\b[A-Za-z0-9\s]{50,}\b/.test(tableText)) score += 4;
        
        // Check for "Qty" column with value "1"
        // This is tricky in raw text, looking for "1" near a price pattern
        if (/\b1\s+[0-9,]+\./.test(tableText)) score += 2;
        
        // Check for Price > 100
        const prices = tableText.match(/[0-9,]+\.[0-9]{2}/g);
        if (prices) {
             const maxPrice = Math.max(...prices.map(p => parseFloat(p.replace(/,/g, '')) || 0));
             if (maxPrice > 100) score += 2;
             if (maxPrice < 50) score -= 3; // Penalty for very low totals (likely Fees)
        }

        // Negative Indicators (Service/Fee Tables)
        if (lowerTable.includes('cash on delivery') || lowerTable.includes('pay on delivery')) score -= 5;
        if (lowerTable.includes('shipping charges') || lowerTable.includes('delivery charges')) score -= 5;
        if (lowerTable.includes('service accounting code') || lowerTable.includes('sac')) score -= 5;
        if (lowerTable.includes('convenience fee') || lowerTable.includes('cod fee')) score -= 5;
        
        console.log(`[Amazon] Table ${index} Score: ${score}`);
        
        if (score > maxScore) {
            maxScore = score;
            bestTable = tableText;
        }
    });

    if (!bestTable) {
        console.log('[Amazon] No valid table found.');
        return null;
    }

    console.log(`[Amazon] Selected Table with Score ${maxScore}. Scanning rows...`);

    // STEP 3: Extract First Valid Row from Selected Table
    const lines = bestTable.split(/[\r\n]+/);
    
    // Find header index within this block
    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        const lowerLine = lines[i].toLowerCase();
        if ((lowerLine.includes('description') && !lowerLine.includes('tax')) || 
            lowerLine.includes('particulars') ||
            (lowerLine.includes('title') && !lowerLine.includes('sub')) ||
            (lowerLine.includes('sl') && lowerLine.includes('no'))) {
            headerIndex = i;
            break;
        }
    }
    
    const startScanIndex = headerIndex !== -1 ? headerIndex + 1 : 0;
    
    // Scan up to 20 lines
    for (let i = startScanIndex; i < Math.min(lines.length, startScanIndex + 20); i++) {
        let line = lines[i].trim();
        
        // --- CLEANING SERIAL NUMBERS ---
        // Matches "1 ", "1.", "(1)"
        line = line.replace(/^[\(\[]?\d+[\)\]\.]?\s+/, '');
        
        const lowerLine = line.toLowerCase();
        
        // --- HARD BLOCK RULES ---
        const blockKeywords = [
            'total', 'grand total', 'sub total', 'tax', 'cgst', 'sgst', 'igst', 
            'vat', 'rate', 'discount', 'shipping', 'delivery', 'round off',
            'amount', 'net amount', 'gross amount', 'taxable value', 
            'unit price', 'quantity', 'qty', 'hsn', 'sac', 'sku',
            'invoice number', 'order number', 'sold by', 'bill to', 'ship to',
            'pickup', 'return', 'policy', 'page', 'of', 'website', 'customer',
            'coupon', 'promotion', 'saving', 'cod fee', 'service charge',
            'cash on delivery', 'pay on delivery'
        ];
        
        if (blockKeywords.some(kw => lowerLine.includes(kw))) {
             continue;
        }
        
        // --- VALIDATION RULES ---
        // 1. Length Check
        if (line.length < 10) continue; 
        
        // 2. Alphabetic Check
        if (!/[a-zA-Z]/.test(line)) continue;

        // 3. Word Count
        const wordCount = line.split(/\s+/).length;
        if (wordCount < 2) continue; // Allow 2 words like "Sony Headphones"
        
        // 4. Numeric Density
        const digitCount = (line.match(/\d/g) || []).length;
        if (digitCount / line.length > 0.4) continue;
        
        // 5. Currency Check
        if (/^[₹Rs\.\s0-9]+$/.test(line)) continue;

        // --- SUCCESS ---
        // Post-Cleaning
        let productName = line;
        productName = productName.replace(/\s+(HSN|SAC|sku|asin)[:\s\-].*$/i, '');
        productName = productName.replace(/\s+₹?\s*[\d,]+\.?\d*$/i, '');
        productName = productName.replace(/\s*\(?B0[A-Z0-9]{8,10}\)?\s*$/i, '');
        productName = productName.replace(/\s*\|\s*B0[A-Z0-9]{8,10}.*$/i, '');
        
        productName = productName.trim();
        
        if (productName.length < 5) continue;

        console.log(`[Amazon] Valid Product Found: "${productName}"`);
        return productName;
    }

    console.log('[Amazon] No valid product name found in selected table. Using Fallback...');
    // Fallback logic could go here if needed, but table match usually succeeds
    // Try the "1 <Product> Price" pattern on the FULL text as a last resort
    const fallbackMatch = text.match(/\b1\s+([A-Za-z0-9][^]*?)(?=\s*(?:₹|HSN:))/i);
    if (fallbackMatch) {
       let name = fallbackMatch[1].trim();
       if (name.length > 10 && name.length < 300) {
         name = name.replace(/[\r\n]+/g, ' ');
         return name.replace(/\s+/g, ' ');
       }
    }

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
