/**
 * Platform Detection Service
 * Detects invoice platform (Amazon, Flipkart, or Unknown) using strong signals
 */

class PlatformDetector {
  /**
   * Detect platform from invoice text
   * @param {string} text - Invoice text
   * @returns {string} 'amazon' | 'flipkart' | 'unknown'
   */
  detect(text) {
    if (!text) return 'unknown';

    const lowerText = text.toLowerCase();
    
    // AMAZON DETECTION - Strong signals
    const amazonSignals = [
      lowerText.includes('amazon.in'),
      lowerText.includes('amazon seller services'),
      lowerText.includes('amazon basics'),
      /order\s*number[:\s]*\d{3}-\d{7,10}-\d{7,10}/i.test(text), // 123-1234567-1234567
      lowerText.includes('amazon.com'),
      lowerText.includes('amazon transportation services')
    ];
    
    const amazonScore = amazonSignals.filter(Boolean).length;
    
    // FLIPKART DETECTION - Strong signals
    const flipkartSignals = [
      lowerText.includes('flipkart'),
      lowerText.includes('tech-connect retail'),
      lowerText.includes('flipkart internet private limited'),
      /gstin[:\s]*27aaica/i.test(text), // Flipkart GSTIN
      /order\s*id[:\s]*od\d{10,}/i.test(text), // OD123456789012
      lowerText.includes('flipkart seller services')
    ];
    
    const flipkartScore = flipkartSignals.filter(Boolean).length;
    
    // Decision logic
    if (amazonScore >= 2) {
      console.log(`[Platform] Detected: AMAZON (${amazonScore} signals)`);
      return 'amazon';
    }
    
    if (flipkartScore >= 2) {
      console.log(`[Platform] Detected: FLIPKART (${flipkartScore} signals)`);
      return 'flipkart';
    }
    
    // Weak detection (single signal)
    if (amazonScore > 0) {
      console.log(`[Platform] Weak detection: AMAZON (${amazonScore} signal)`);
      return 'amazon';
    }
    
    if (flipkartScore > 0) {
      console.log(`[Platform] Weak detection: FLIPKART (${flipkartScore} signal)`);
      return 'flipkart';
    }
    
    console.log('[Platform] Detected: UNKNOWN (no platform signals)');
    return 'unknown';
  }

  /**
   * Get confidence level of platform detection
   * @param {string} text - Invoice text
   * @param {string} detectedPlatform - Detected platform
   * @returns {number} Confidence score (0-100)
   */
  getConfidence(text, detectedPlatform) {
    if (!text || !detectedPlatform || detectedPlatform === 'unknown') {
      return 0;
    }

    const lowerText = text.toLowerCase();
    let signals = 0;
    let maxSignals = 0;

    if (detectedPlatform === 'amazon') {
      maxSignals = 6;
      if (lowerText.includes('amazon.in')) signals++;
      if (lowerText.includes('amazon seller services')) signals++;
      if (lowerText.includes('amazon basics')) signals++;
      if (/order\s*number[:\s]*\d{3}-\d{7,10}-\d{7,10}/i.test(text)) signals++;
      if (lowerText.includes('amazon.com')) signals++;
      if (lowerText.includes('amazon transportation services')) signals++;
    } else if (detectedPlatform === 'flipkart') {
      maxSignals = 6;
      if (lowerText.includes('flipkart')) signals++;
      if (lowerText.includes('tech-connect retail')) signals++;
      if (lowerText.includes('flipkart internet private limited')) signals++;
      if (/gstin[:\s]*27aaica/i.test(text)) signals++;
      if (/order\s*id[:\s]*od\d{10,}/i.test(text)) signals++;
      if (lowerText.includes('flipkart seller services')) signals++;
    }

    return Math.round((signals / maxSignals) * 100);
  }
}

module.exports = new PlatformDetector();
