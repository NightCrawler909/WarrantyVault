/**
 * Page Classification Service
 * Scores and selects the best page from multi-page PDFs
 */

class PageClassifier {
  /**
   * Classify and score pages
   * @param {Array} pages - Array of page objects with text
   * @returns {Array} Pages with scores and classification
   */
  classifyPages(pages) {
    if (!pages || pages.length === 0) {
      return [];
    }

    console.log(`\n[PageClassifier] Analyzing ${pages.length} page(s)...`);

    const classifiedPages = pages.map(page => {
      const classification = this.classifyPage(page.text);
      return {
        ...page,
        ...classification
      };
    });

    return classifiedPages;
  }

  /**
   * Classify a single page
   * @param {string} text - Page text
   * @returns {Object} Classification with score, type, and maxTotal
   */
  classifyPage(text) {
    let score = 0;
    const lowerText = text.toLowerCase();
    const indicators = [];

    // --- POSITIVE INDICATORS (Product Page) ---

    // 1. Check for HSN or Product Code
    const hasHSN = /HSN[:\s]*\d{4,8}/i.test(text);
    const hasASIN = /B0[A-Z0-9]{8}/.test(text);
    
    if (hasHSN) {
        score += 30;
        indicators.push('HSN Found');
    }
    if (hasASIN) {
        score += 40;
        indicators.push('ASIN Found');
    }

    // 2. Check for "Qty = 1" and "Price > 100" in same/nearby lines
    // This is a strong indicator of a product row
    const lines = text.split(/[\r\n]+/);
    let hasProductRow = false;
    
    for (const line of lines) {
        // Look for lines containing "1" (Qty) and a large price
        // Matches "1 " or " 1 " and a price like "488.00" or "1,299"
        if (/\b1\s+/.test(line) || /\s+1\s+/.test(line)) {
            // Check for price > 100
            const prices = line.match(/[0-9,]+\.[0-9]{2}/g);
            if (prices) {
                const maxPrice = Math.max(...prices.map(p => parseFloat(p.replace(/,/g, ''))));
                if (maxPrice > 100) {
                    hasProductRow = true;
                    // Additional check to ensure it's not a total line
                    if (!line.toLowerCase().includes('total') && !line.toLowerCase().includes('tax')) {
                         score += 50; 
                         indicators.push('Product Row (Qty=1, Price>100)');
                         break;
                    }
                }
            }
        }
    }

    // 3. Long Description Check
    if (/\b[A-Za-z]{3,}\s+[A-Za-z]{3,}\s+[A-Za-z]{3,}\s+[A-Za-z]{3,}/.test(text)) {
        // At least 4 words in sequence
        score += 10;
        indicators.push('Description Text');
    }

    // --- NEGATIVE INDICATORS (Service/COD page) ---
    
    // If page contains ONLY service charges
    const serviceKeywords = [
        'service accounting code', 
        'cash on delivery', 
        'pay on delivery', 
        'cod fee', 
        'shipping charges',
        'convenience fee'
    ];
    
    let serviceScore = 0;
    for (const kw of serviceKeywords) {
        if (lowerText.includes(kw)) {
            serviceScore += 20;
            indicators.push(`Service Keyword (${kw})`);
        }
    }

    // If strong service indicators present but weak product indicators
    if (serviceScore > 0 && !hasProductRow && !hasASIN) {
        score -= 100; // Heavily penalize
        indicators.push('LIKELY SERVICE PAGE');
    }

    // Extract maximum total amount
    const maxTotal = this.extractMaxTotal(text);

    // Determines page type
    let pageType = 'unknown';
    if (score > 40) {
      pageType = 'product';
    } else if (score < 0) {
      pageType = 'service';
    }

    return {
      score,
      pageType,
      maxTotal,
      indicators: indicators.join(', ')
    };
  }

  /**
   * Extract maximum total from page
   * @param {string} text - Page text
   * @returns {number} Maximum total amount
   */
  extractMaxTotal(text) {
    const totals = [];

    // Pattern 1: TOTAL:
    const totalMatches = [...text.matchAll(/TOTAL[:\s]*₹?\s*([0-9.,]+)/gi)];
    totalMatches.forEach(match => {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(amount) && amount > 0) {
        totals.push(amount);
      }
    });

    // Pattern 2: Grand Total
    const grandTotalMatches = [...text.matchAll(/Grand\s*Total[:\s]*₹?\s*([0-9.,]+)/gi)];
    grandTotalMatches.forEach(match => {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(amount) && amount > 0) {
        totals.push(amount);
      }
    });

    // Pattern 3: Total Amount
    const totalAmountMatches = [...text.matchAll(/Total\s*Amount[:\s]*₹?\s*([0-9.,]+)/gi)];
    totalAmountMatches.forEach(match => {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(amount) && amount > 0) {
        totals.push(amount);
      }
    });

    return totals.length > 0 ? Math.max(...totals) : 0;
  }

  /**
   * Select best page from classified pages
   * @param {Array} classifiedPages - Pages with classification
   * @returns {Object} Best page or null
   */
  selectBestPage(classifiedPages) {
    if (!classifiedPages || classifiedPages.length === 0) {
      return null;
    }

    // For single page, return it
    if (classifiedPages.length === 1) {
      console.log('[PageClassifier] Single page - using it directly');
      return classifiedPages[0];
    }

    console.log('\n[PageClassifier] Page Scores:');
    classifiedPages.forEach(page => {
      const emoji = page.pageType === 'service' ? '🚫' : page.pageType === 'product' ? '✅' : '❓';
      console.log(`  ${emoji} Page ${page.pageIndex}: Score=${page.score}, Total=₹${page.maxTotal}, Type=${page.pageType.toUpperCase()}`);
      if (page.indicators) {
        console.log(`     Indicators: ${page.indicators}`);
      }
    });

    // Sort by score (descending)
    const sorted = [...classifiedPages].sort((a, b) => b.score - a.score);

    // Handle ties with maxTotal
    const topScore = sorted[0].score;
    const topPages = sorted.filter(p => p.score === topScore);

    let bestPage;
    if (topPages.length > 1) {
      console.log(`\n[PageClassifier] Tie detected (${topPages.length} pages with score ${topScore})`);
      console.log('[PageClassifier] Using maxTotal as tiebreaker...');
      bestPage = topPages.sort((a, b) => b.maxTotal - a.maxTotal)[0];
    } else {
      bestPage = sorted[0];
    }

    console.log(`\n[PageClassifier] ✅ Selected Page ${bestPage.pageIndex} (Score: ${bestPage.score}, Total: ₹${bestPage.maxTotal})\n`);

    return bestPage;
  }
}

module.exports = new PageClassifier();
