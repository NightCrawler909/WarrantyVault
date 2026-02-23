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
   * Extract product title using STRICT TABLE-BASED Strategy (Multi-Table Support)
   * Focus: Identifying correct product table among multiple tables (e.g. Tax/Fee vs Product)
   * @param {string} text - Invoice text
   * @returns {string|null} Product title
   */
  extractProductTitle(text) {
    console.log('[Flipkart] Attempting STRICT TABLE-BASED product extraction...');
    
    // STEP 1: Split text into potential table blocks
    // Flipkart tables usually start with headers like: "Product Name", "Title", "Description", "Sl No"
    const splitPattern = /(?=(?:Sl\.?\s*No|Description|Title|Product\s*Name))/i;
    const rawTables = text.split(splitPattern);
    
    // Filter out very short blocks or blocks without relevant content
    const tables = rawTables.filter(t => t.length > 50 && (
        t.toLowerCase().includes('description') || 
        t.toLowerCase().includes('title') || 
        t.toLowerCase().includes('product')
    ));
    
    if (tables.length === 0) {
        tables.push(text); // Fallback: use entire text
    }

    console.log(`[Flipkart] Found ${tables.length} potential table blocks.`);

    // STEP 2: Score Each Table
    let bestTable = null;
    let maxScore = -999;

    tables.forEach((tableText, index) => {
        let score = 0;
        const lowerTable = tableText.toLowerCase();

        // Positive Indicators
        if (/HSN[:\s]*\d{4,8}/i.test(tableText)) score += 5;
        if (/Taxable\s*Value/i.test(tableText)) score += 2; // Flipkart product tables often have this
        
        // Find "Qty" column with value "1"
        if (/\b1\s+[0-9,]+\./.test(tableText)) score += 2;

        // Long Description Check (> 40 chars)
        if (/\b[A-Za-z0-9\s\-\(\)]{40,}\b/.test(tableText)) score += 4;

        // Price Logic
        const prices = tableText.match(/[0-9,]+\.[0-9]{2}/g);
        if (prices) {
             const maxPrice = Math.max(...prices.map(p => parseFloat(p.replace(/,/g, '')) || 0));
             if (maxPrice > 100) score += 2;
             if (maxPrice < 50) score -= 3;
        }

        // Negative Indicators (Service/Fee Tables)
        if (lowerTable.includes('shipping charges') || lowerTable.includes('delivery charges')) score -= 5;
        if (lowerTable.includes('convenience fee')) score -= 5;
        if (lowerTable.includes('tax details') && !lowerTable.includes('product')) score -= 3; // Tax only table

        console.log(`[Flipkart] Table ${index} Score: ${score}`);
        
        if (score > maxScore) {
            maxScore = score;
            bestTable = tableText;
        }
    });

    if (!bestTable) {
        console.log('[Flipkart] No valid table found.');
        return null;
    }

    console.log(`[Flipkart] Selected Table with Score ${maxScore}. Scanning rows...`);

    // STEP 3: Extract First Valid Row from Selected Table
    const lines = bestTable.split(/[\r\n]+/);
    
    // Find header index within this block
    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        const lowerLine = lines[i].toLowerCase();
        if ((lowerLine.includes('description') && !lowerLine.includes('tax')) || 
            (lowerLine.includes('title') && !lowerLine.includes('sub')) ||
            (lowerLine.includes('sl') && lowerLine.includes('no')) ||
            lowerLine.includes('product') && lowerLine.includes('name')) {
            headerIndex = i;
            break;
        }
    }
    
    const startScanIndex = headerIndex !== -1 ? headerIndex + 1 : 0;
    
    for (let i = startScanIndex; i < Math.min(lines.length, startScanIndex + 25); i++) {
        let line = lines[i].trim();

        // --- PRE-CLEANING ---
        // Clean up common Flipkart serial numbers "1 " or "1"
        line = line.replace(/^\d+\s+/, '');
        const lowerLine = line.toLowerCase();

        // --- HARD BLOCK RULES (Reject these lines immediately) ---
        const blockKeywords = [
            'total', 'grand total', 'taxable value', 'cgst', 'sgst', 'igst', 
            'vat', 'rate', 'discount', 'shipping', 'delivery', 
            'amount', 'net amount', 'gross amount', 
            'unit price', 'quantity', 'qty', 'hsn', 'sac', 'sku',
            'authorized signatory', 'ordered', 'delivered', 'through', 
            'invoice number', 'order id', 'sold by', 'return', 'policy',
            'coupon', 'promotion', 'saving', 'cash', 'pay',
            'cod fee', 'service charge', 'service accounting code', 'convenience fee'
        ];
        
        if (blockKeywords.some(kw => lowerLine.includes(kw))) {
             continue; // Skip this line
        }

        // --- VALIDATION RULES ---

        // 1. Length Check (> 10 chars, strict)
        if (line.length < 10) continue; 
        
        // 2. Alphabetic Check (Must have letters)
        if (!/[a-zA-Z]/.test(line)) continue;

        // 3. Word Count (At least 2 words)
        const wordCount = line.split(/\s+/).length;
        if (wordCount < 2) continue;

        // 4. Numeric Density (Reject if > 40% digits)
        const digitCount = (line.match(/\d/g) || []).length;
        if (digitCount / line.length > 0.4) continue;

        // 5. Currency Symbol Only Check (Reject "₹ 300.00")
        if (/^[₹Rs\.\s0-9]+$/.test(line)) continue;

        // --- SUCCESS ---
        let productName = line;
        
        // Remove HSN/SAC codes if attached at end
        productName = productName.replace(/\s+(HSN|SAC)[:\s\-].*$/i, '');
        
        // Remove prices at the end of the string
        productName = productName.replace(/\s+₹?\s*[\d,]+\.?\d*$/i, '');
        
        // Remove trailing "HSN:"
        productName = productName.replace(/\sHSN:.*$/i, '');
        productName = productName.replace(/\sHSN\/SAC:.*$/i, '');

        // Final trim
        productName = productName.trim();

        console.log(`[Flipkart] Valid Product Found: "${productName}"`);
        return productName;
    }
    
    console.log('[Flipkart] No valid product title found in selected table. Using Fallback...');
    
    // Fallback: Try regex for "1 <Product> Price" pattern (Original logic)
    const fallbackMatch = text.match(/\b1\s+([A-Za-z0-9][^]*?)(?=\s*(?:HSN|SAC|₹))/i);
    if (fallbackMatch) {
       let name = fallbackMatch[1].trim();
       if (name.length > 10 && name.length < 200) {
         name = name.replace(/[\r\n]+/g, ' ');
         return name.replace(/\s+/g, ' ');
       }
    }

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
