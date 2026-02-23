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

    // NEGATIVE INDICATORS (Service/COD page)
    if (lowerText.includes('service accounting code')) {
      score -= 50;
      indicators.push('Service Code');
    }
    if (lowerText.includes('cash on delivery') || lowerText.includes('pay on delivery')) {
      score -= 50;
      indicators.push('COD');
    }
    if (/\bcod\b/i.test(text)) {
      score -= 50;
      indicators.push('COD keyword');
    }
    if (/amount in words:\s*(seven|eight|nine|ten)\s*only/i.test(text)) {
      score -= 50;
      indicators.push('Small amount');
    }
    if (lowerText.includes('delivery charges') || lowerText.includes('cod fee')) {
      score -= 30;
      indicators.push('Service fee');
    }

    // POSITIVE INDICATORS (Product page)
    if (/hsn[:\s]*\d{8}/i.test(text)) {
      score += 20;
      indicators.push('HSN-8');
    }
    if (lowerText.includes('unit price')) {
      score += 20;
      indicators.push('Unit Price');
    }
    if (lowerText.includes('qty')) {
      score += 20;
      indicators.push('Qty');
    }
    if (/\b1\s+[A-Za-z0-9\s]{40,}/i.test(text)) {
      score += 30;
      indicators.push('Long description');
    }
    if (/B0[A-Z0-9]{8}/.test(text)) {
      score += 30;
      indicators.push('ASIN');
    }

    // Extract maximum total amount
    const maxTotal = this.extractMaxTotal(text);

    // Apply total-based modifiers
    if (maxTotal > 100) {
      score += 40;
      indicators.push(`Total>100 (₹${maxTotal})`);
    } else if (maxTotal > 0 && maxTotal < 50) {
      score -= 30;
      indicators.push(`Total<50 (₹${maxTotal})`);
    }

    // Determine page type
    let pageType = 'unknown';
    if (score < 0) {
      pageType = 'service';
    } else if (score > 50) {
      pageType = 'product';
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
