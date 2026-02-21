/**
 * Test robust scoring system with sample Amazon multi-page data
 */

const pdfService = require('./services/pdfService');

console.log('\n' + '='.repeat(80));
console.log('🧪 ROBUST SCORING SYSTEM TEST');
console.log('='.repeat(80) + '\n');

// Simulate two pages from PDF extraction
const pages = [
  {
    pageIndex: 1,
    text: `
Tax Invoice/Bill of Supply/Cash Memo
Service Accounting Code: 995519
Cash on Delivery

Description: COD Fee
TOTAL: ₹7.00
Amount in Words: Seven only
Sold By: Amazon Seller Services
    `.trim()
  },
  {
    pageIndex: 2,
    text: `
Tax Invoice
Invoice Number: FBOI-61720
Order Number: 403-1987375-5842760
Order Date: 15.02.2025

HSN: 61159990

Sl  Description                                          Unit Price  Qty  Amount
1   Wearslim Comfortable Cotton Gynecomastia            455.00      1    455.00
    Compression Shirt for Men (B0C99QWXJ6)

Shipping: ₹33.00
TOTAL: ₹488.00

Sold By: Galacy
    `.trim()
  }
];

console.log('📄 Simulating 2-page Amazon PDF...\n');
console.log(`Page 1: COD invoice (7 rupees)`);
console.log(`Page 2: Product invoice (488 rupees)\n`);

console.log('='.repeat(80));
console.log('STEP 1: Analyzing pages with robust scoring...');
console.log('='.repeat(80) + '\n');

const analyzed = pdfService.analyzePages(pages);

console.log('\n' + '='.repeat(80));
console.log('STEP 2: Selecting best page...');
console.log('='.repeat(80));

const bestPage = pdfService.selectBestPage(analyzed);

console.log('\n' + '='.repeat(80));
console.log('🎯 FINAL RESULT');
console.log('='.repeat(80));

if (bestPage) {
  console.log(`\n✅ Selected Page: ${bestPage.pageIndex}`);
  console.log(`   Score: ${bestPage.score}`);
  console.log(`   Max Total: ₹${bestPage.maxTotal}`);
  console.log(`   Page Type: ${bestPage.pageType.toUpperCase()}`);
  console.log(`\n📊 Score Breakdown:`);
  console.log(`   • Service indicators: Heavy penalties (-50 each)`);
  console.log(`   • Product indicators: Good rewards (+20 to +30 each)`);
  console.log(`   • Total amount modifier: +40 for total > 100, -30 for total < 50`);
  console.log(`\n🔥 WHY THIS WORKS:`);
  console.log(`   • Page 1 (COD): Service indicators → NEGATIVE SCORE`);
  console.log(`   • Page 2 (Product): Product indicators + high total → POSITIVE SCORE`);
  console.log(`   • System automatically selects page with HIGHEST SCORE`);
  console.log(`   • Tiebreaker: If scores equal, use highest total\n`);
} else {
  console.log('\n❌ ERROR: No page selected\n');
}

console.log('='.repeat(80) + '\n');

// Validate expected behavior
const success = bestPage && bestPage.pageIndex === 2 && bestPage.score > 0;
if (success) {
  console.log('✅✅✅ ROBUST SCORING SYSTEM WORKING PERFECTLY! ✅✅✅\n');
  process.exit(0);
} else {
  console.log('❌ UNEXPECTED RESULT - REVIEW SCORING LOGIC\n');
  process.exit(1);
}
