/**
 * Price Extraction Service
 * Centralized price extraction logic - always selects LARGEST relevant total
 */

class PriceExtractor {
  /**
   * Extract price from invoice text
   * @param {string} text - Invoice text
   * @param {string} platform - Platform name (for platform-specific logic)
   * @returns {number|null} Extracted price
   */
  extract(text, platform = 'unknown') {
    console.log(`[Price] Extracting from ${platform.toUpperCase()} invoice...`);

    const amounts = [];

    // Priority 1: Grand Total (most reliable)
    const grandTotalMatches = [...text.matchAll(/Grand\s*Total[:\s]*₹?\s*([0-9.,]+)/gi)];
    grandTotalMatches.forEach((match, idx) => {
      const amount = this.parseAmount(match[1]);
      if (amount) {
        amounts.push({ amount, source: 'Grand Total', priority: 1, index: idx });
        console.log(`[Price] Found Grand Total #${idx + 1}: ₹${amount}`);
      }
    });

    // Priority 2: TOTAL: (common pattern)
    // Updated pattern: Capture entire TOTAL line, then extract ALL amounts from it
    const totalLineMatches = [...text.matchAll(/TOTAL[:\s][^\n]*/gi)];
    totalLineMatches.forEach((lineMatch, lineIdx) => {
      const line = lineMatch[0];
      // Extract ALL currency amounts from the TOTAL line
      const amountsInLine = [...line.matchAll(/₹\s*([0-9.,]+)/g)];
      
      if (amountsInLine.length > 0) {
        // Get the LAST amount on the line (typically the actual total)
        const lastAmount = this.parseAmount(amountsInLine[amountsInLine.length - 1][1]);
        if (lastAmount) {
          amounts.push({ amount: lastAmount, source: 'TOTAL', priority: 2, index: lineIdx });
          console.log(`[Price] Found TOTAL (line ${lineIdx + 1}): ₹${lastAmount} (${amountsInLine.length} amounts on line, selected LAST)`);
        }
      }
    });

    // Priority 3: Total Amount
    const totalAmountMatches = [...text.matchAll(/Total\s*Amount[:\s]*₹?\s*([0-9.,]+)/gi)];
    totalAmountMatches.forEach((match, idx) => {
      const amount = this.parseAmount(match[1]);
      if (amount) {
        amounts.push({ amount, source: 'Total Amount', priority: 3, index: idx });
        console.log(`[Price] Found Total Amount #${idx + 1}: ₹${amount}`);
      }
    });

    // Priority 4: Final Amount / Net Amount (Flipkart)
    const finalAmountMatches = [...text.matchAll(/(Final|Net)\s*Amount[:\s]*₹?\s*([0-9.,]+)/gi)];
    finalAmountMatches.forEach((match, idx) => {
      const amount = this.parseAmount(match[2]);
      if (amount) {
        amounts.push({ amount, source: 'Final/Net Amount', priority: 4, index: idx });
        console.log(`[Price] Found Final/Net Amount #${idx + 1}: ₹${amount}`);
      }
    });

    if (amounts.length === 0) {
      console.log('[Price] ⚠️  No labeled totals found, trying fallback...');
      return this.extractFallback(text);
    }

    // Select LARGEST amount (product invoice > service fee)
    amounts.sort((a, b) => {
      // Sort by priority first
      if (a.priority !== b.priority) return a.priority - b.priority;
      // Then by amount (descending)
      return b.amount - a.amount;
    });

    const selected = amounts[0];
    console.log(`[Price] ✅ Selected LARGEST: ₹${selected.amount} (${selected.source})`);

    if (amounts.length > 1) {
      const others = amounts.slice(1).map(a => `₹${a.amount} (${a.source})`).join(', ');
      console.log(`[Price] Rejected: ${others}`);
    }

    return selected.amount;
  }

  /**
   * Parse amount string to number
   * @param {string} amountStr - Amount string
   * @returns {number|null} Parsed amount
   */
  parseAmount(amountStr) {
    if (!amountStr) return null;

    // Remove commas and parse
    const cleaned = amountStr.replace(/,/g, '');
    const amount = parseFloat(cleaned);

    // Sanity checks
    if (isNaN(amount) || amount <= 0 || amount > 1000000) {
      return null;
    }

    return amount;
  }

  /**
   * Fallback: Extract all currency values and pick largest reasonable one
   * @param {string} text - Invoice text
   * @returns {number|null} Extracted price
   */
  extractFallback(text) {
    console.log('[Price] Running fallback extraction...');

    const currencyMatches = [...text.matchAll(/₹\s*([0-9.,]+)/g)];
    const amounts = currencyMatches
      .map(m => this.parseAmount(m[1]))
      .filter(a => a !== null && a >= 10); // Filter very small amounts

    if (amounts.length === 0) {
      console.log('[Price] ❌ No valid amounts found');
      return null;
    }

    // Strategy: Use largest amount (likely invoice total)
    const maxAmount = Math.max(...amounts);
    console.log(`[Price] ⚠️  Fallback: Selected largest ₹ value: ₹${maxAmount}`);

    return maxAmount;
  }

  /**
   * Validate extracted price
   * @param {number} price - Extracted price
   * @param {string} platform - Platform name
   * @returns {boolean} Is valid
   */
  validate(price, platform = 'unknown') {
    if (!price || price <= 0) {
      return false;
    }

    // Platform-specific validation
    if (platform === 'flipkart' || platform === 'amazon') {
      // Minimum reasonable price for e-commerce
      if (price < 10) {
        console.log(`[Price] ⚠️  Suspiciously low price: ₹${price}`);
        return false;
      }

      // Maximum reasonable price
      if (price > 500000) {
        console.log(`[Price] ⚠️  Suspiciously high price: ₹${price}`);
        return false;
      }
    }

    return true;
  }
}

module.exports = new PriceExtractor();
