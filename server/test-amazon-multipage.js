/**
 * Test script for Amazon multi-page PDF processing
 * 
 * Usage:
 *   node test-amazon-multipage.js <path-to-pdf>
 * 
 * Example:
 *   node test-amazon-multipage.js ./uploads/amazon-invoice.pdf
 */

const pdfService = require('./services/pdfService');
const ocrService = require('./services/ocrService');
const path = require('path');
const fs = require('fs');

async function testMultiPageProcessing(pdfPath) {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 AMAZON MULTI-PAGE PDF TEST');
  console.log('='.repeat(80));
  console.log(`\n📄 Testing file: ${path.basename(pdfPath)}\n`);

  try {
    // Check file exists
    if (!fs.existsSync(pdfPath)) {
      console.error(`❌ Error: File not found: ${pdfPath}`);
      process.exit(1);
    }

    // Step 1: Extract text per page
    console.log('STEP 1: Page-Level Text Extraction');
    console.log('-'.repeat(80));
    const pages = await pdfService.extractTextPerPage(pdfPath);
    console.log(`✅ Extracted ${pages.length} page(s)\n`);

    pages.forEach((page, index) => {
      console.log(`📄 Page ${page.pageIndex}:`);
      console.log(`   Text length: ${page.length} chars`);
      console.log(`   Preview: ${page.text.substring(0, 100).replace(/\n/g, ' ')}...`);
      console.log();
    });

    // Step 2: Analyze pages
    console.log('\nSTEP 2: Page Classification & Analysis');
    console.log('-'.repeat(80));
    const analyzed = pdfService.analyzePages(pages);
    
    analyzed.forEach(page => {
      const typeEmoji = page.pageType === 'service' ? '🚫' : page.pageType === 'product' ? '✅' : '❓';
      console.log(`${typeEmoji} Page ${page.pageIndex}:`);
      console.log(`   Type: ${page.pageType.toUpperCase()}`);
      console.log(`   Total Amount: ₹${page.totalAmount || 'N/A'}`);
      console.log(`   Has Product Indicators: ${page.hasProductIndicators ? 'Yes' : 'No'}`);
      console.log(`   Quality Score: ${page.quality.toFixed(2)}`);
      if (page.pageType === 'service') {
        console.log(`   ⚠️  SERVICE PAGE - Will be filtered out`);
      }
      console.log();
    });

    // Step 3: Select best page
    console.log('\nSTEP 3: Best Page Selection (Service pages filtered out)');
    console.log('-'.repeat(80));
    const bestPage = pdfService.selectBestPage(analyzed);

    if (!bestPage) {
      console.error('❌ Error: No page selected');
      process.exit(1);
    }

    console.log(`\n✅ RESULT: Page ${bestPage.pageIndex} selected (Type: ${bestPage.pageType.toUpperCase()})\n`);

    // Step 4: Full OCR pipeline test
    console.log('\nSTEP 4: Full OCR Pipeline (with page selection)');
    console.log('-'.repeat(80));
    const result = await ocrService.processInvoice(pdfPath);

    if (!result.success) {
      console.error('❌ Error: OCR processing failed');
      console.error(result.error);
      process.exit(1);
    }

    console.log('\n✅ OCR PROCESSING SUCCESSFUL\n');

    // Step 5: Display extracted data
    console.log('\nSTEP 5: Extracted Invoice Data');
    console.log('-'.repeat(80));
    const data = result.extractedData;

    console.log(`\n📦 Platform: ${data.platform || 'N/A'}`);
    console.log(`\n📋 Order Information:`);
    console.log(`   Order ID: ${data.detectedOrderId || 'Not found'}`);
    console.log(`   Invoice Number: ${data.detectedInvoiceNumber || 'Not found'}`);
    console.log(`   Order Date: ${data.detectedOrderDate || data.detectedPurchaseDate || 'Not found'}`);
    
    console.log(`\n🛍️  Product Details:`);
    console.log(`   Product Name: ${data.detectedProductName || 'Not found'}`);
    console.log(`   Amount: ₹${data.detectedAmount || 'Not found'}`);
    
    console.log(`\n🏪 Vendor Information:`);
    console.log(`   Vendor: ${data.detectedVendor || data.detectedRetailer || 'Not found'}`);
    console.log(`   HSN Code: ${data.detectedHSN || 'Not found'}`);

    console.log(`\n📊 Extraction Metadata:`);
    console.log(`   Method: ${data.extractionMethod || result.method || 'N/A'}`);
    console.log(`   Confidence: ${data.confidence || 'N/A'}`);

    // Step 6: Validation
    console.log('\n\nSTEP 6: Validation');
    console.log('-'.repeat(80));
    
    const validations = [
      { field: 'Order ID', value: data.detectedOrderId, required: true },
      { field: 'Product Name', value: data.detectedProductName, required: true },
      { field: 'Amount', value: data.detectedAmount, required: true, checkPositive: true },
      { field: 'Date', value: data.detectedOrderDate || data.detectedPurchaseDate, required: true },
    ];

    let allValid = true;
    validations.forEach(v => {
      const hasValue = v.value && v.value !== null && v.value !== '';
      const isPositive = !v.checkPositive || (typeof v.value === 'number' && v.value > 0);
      const valid = hasValue && isPositive;
      
      if (!valid && v.required) allValid = false;
      
      const icon = valid ? '✅' : '❌';
      console.log(`${icon} ${v.field}: ${valid ? 'Valid' : 'Missing or Invalid'}`);
    });

    console.log('\n' + '='.repeat(80));
    if (allValid) {
      console.log('✅ ALL VALIDATIONS PASSED');
    } else {
      console.log('⚠️  SOME VALIDATIONS FAILED');
    }
    console.log('='.repeat(80) + '\n');

    process.exit(allValid ? 0 : 1);

  } catch (error) {
    console.error('\n❌ TEST FAILED\n');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('\n❌ Error: No file path provided\n');
  console.log('Usage: node test-amazon-multipage.js <path-to-pdf>');
  console.log('Example: node test-amazon-multipage.js ./uploads/amazon-invoice.pdf\n');
  process.exit(1);
}

const pdfPath = path.resolve(args[0]);
testMultiPageProcessing(pdfPath);
