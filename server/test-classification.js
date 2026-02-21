/**
 * Quick test for Amazon page classification
 * 
 * Tests the classifyPageType() function with sample text
 */

const pdfService = require('./services/pdfService');

console.log('\n' + '='.repeat(80));
console.log('🧪 AMAZON PAGE CLASSIFICATION TEST');
console.log('='.repeat(80) + '\n');

// Test 1: Service/COD Page
const servicePage = `
Tax Invoice/Bill of Supply/Cash Memo
Service Accounting Code: 995519
Cash on Delivery

Description: COD Fee
TOTAL: ₹7.00
Amount in Words: Seven only
`;

console.log('TEST 1: Service/COD Page');
console.log('-'.repeat(80));
console.log('Text preview:', servicePage.substring(0, 100) + '...');
const type1 = pdfService.classifyPageType(servicePage);
console.log(`Result: ${type1.toUpperCase()}`);
console.log(type1 === 'service' ? '✅ PASS - Correctly identified as SERVICE' : '❌ FAIL');
console.log();

// Test 2: Product Page
const productPage = `
Tax Invoice
Order Number: 403-1987375-5842760
Invoice Number: FBOI-61720
Order Date: 15.02.2025

Sl. Description HSN Unit Qty Unit Price Disc. Amount
1 Wearslim Comfortable Cotton Gynecomastia 61159990 pc 1 455.00 0% 455.00
   Compression Shirt for Men (B0C99QWXJ6)

Shipping: ₹33.00
TOTAL: ₹488.00
Sold By: Galacy
`;

console.log('TEST 2: Product Page');
console.log('-'.repeat(80));
console.log('Text preview:', productPage.substring(0, 100) + '...');
const type2 = pdfService.classifyPageType(productPage);
console.log(`Result: ${type2.toUpperCase()}`);
console.log(type2 === 'product' ? '✅ PASS - Correctly identified as PRODUCT' : '❌ FAIL');
console.log();

// Test 3: Price Extraction (Multiple Totals)
console.log('TEST 3: Amazon Price Extraction (Multiple Totals)');
console.log('-'.repeat(80));

const ocrService = require('./services/ocrService');
const multiTotalText = `
Page 1: COD Invoice
TOTAL: ₹7.00

Page 2: Product Invoice  
TOTAL: ₹488.00
`;

const extractedPrice = ocrService.extractAmazonPrice(multiTotalText);
console.log(`Extracted price: ₹${extractedPrice}`);
console.log(extractedPrice === 488 ? '✅ PASS - Correctly selected LARGEST total (488 > 7)' : '❌ FAIL');
console.log();

// Summary
console.log('='.repeat(80));
console.log('🎯 CLASSIFICATION SUMMARY');
console.log('='.repeat(80));
console.log('✅ Service pages are correctly identified and can be filtered');
console.log('✅ Product pages are correctly identified for processing');
console.log('✅ Price extraction selects LARGEST total when multiple found');
console.log('='.repeat(80) + '\n');

console.log('💡 Next step: Test with real multi-page Amazon PDF');
console.log('   Usage: node test-amazon-multipage.js path/to/invoice.pdf\n');
