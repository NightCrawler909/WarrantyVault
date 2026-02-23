/**
 * Test script for the new Modular Invoice Processing Engine
 * Tests end-to-end extraction with Amazon multi-page PDF
 */

const path = require('path');
const invoiceProcessor = require('./services/invoiceProcessor');

async function testInvoiceProcessor() {
  console.log('🧪 TESTING MODULAR INVOICE PROCESSING ENGINE');
  console.log('='.repeat(60));
  
  // Test file path - adjust this to your actual test file
  const testFile = path.join(__dirname, 'test-pdfs', 'amazon-multipage.pdf');
  
  try {
    console.log(`\nTest file: ${testFile}`);
    console.log('Starting processing...\n');
    
    const result = await invoiceProcessor.process(testFile);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL RESULT');
    console.log('='.repeat(60));
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ VALIDATION');
    console.log('='.repeat(60));
    
    // Validate results
    const validations = [
      { field: 'platform', value: result.platform, expected: 'amazon', pass: result.platform === 'amazon' },
      { field: 'productName', value: result.productName, expected: 'length > 10', pass: result.productName && result.productName.length > 10 },
      { field: 'orderId', value: result.orderId, expected: 'XXX-XXXXXXX-XXXXXXX', pass: /^\d{3}-\d{7}-\d{7}/.test(result.orderId) },
      { field: 'price', value: result.price, expected: '> 100', pass: result.price && result.price > 100 },
      { field: 'invoiceDate', value: result.invoiceDate, expected: 'valid date', pass: !!result.invoiceDate },
      { field: 'retailer', value: result.retailer, expected: 'not empty', pass: !!result.retailer },
      { field: 'confidenceScore', value: result.confidenceScore, expected: '> 60', pass: result.confidenceScore > 60 }
    ];
    
    validations.forEach(v => {
      const status = v.pass ? '✅' : '❌';
      console.log(`${status} ${v.field}: ${v.value} (expected: ${v.expected})`);
    });
    
    const passCount = validations.filter(v => v.pass).length;
    const totalCount = validations.length;
    
    console.log(`\n📈 Score: ${passCount}/${totalCount} validations passed`);
    console.log(`🎯 Confidence: ${result.confidenceScore}%`);
    
    if (passCount === totalCount) {
      console.log('\n🎉 ALL TESTS PASSED!');
    } else {
      console.log('\n⚠️  Some validations failed - review extraction logic');
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run test
testInvoiceProcessor();
