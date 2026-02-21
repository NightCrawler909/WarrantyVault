/**
 * Test script for Flipkart Product Name Extraction
 * 
 * Issue: OCR merges product names with numeric table columns
 * Example: "Electric Jug(heater) Pigeon Favourite Electric 1549.0000465.2641."
 * Expected: "Pigeon Favourite Electric"
 * 
 * Root Cause: Current regex only removes TRAILING patterns like " 1 549.00"
 * but doesn't handle large numbers directly attached like "Electric1549.0000465"
 * 
 * Solution: Split at FIRST numeric pattern, remove tax keywords, validate length
 */

const ocrService = require('./services/ocrService');

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║  FLIPKART PRODUCT NAME EXTRACTION TEST                        ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Test cases simulating various OCR contamination scenarios
const testCases = [
  {
    name: 'Test 1: Large numbers directly attached (User reported case)',
    input: 'Electric Jug(heater) Pigeon Favourite Electric 1549.0000465.2641.',
    expected: 'Electric Jug(heater) Pigeon Favourite Electric',
    description: 'Product name contaminated with price columns - stops at first large number'
  },
  {
    name: 'Test 2: Standard table format with spaces',
    input: 'Pigeon Favourite Electric Kettle 1 549.00 0.00 465.26',
    expected: 'Pigeon Favourite Electric Kettle',
    description: 'Product name with qty, rate, discount, amount columns'
  },
  {
    name: 'Test 3: Tax keywords contamination',
    input: 'Wireless Mouse CGST 9% SGST 9% Amount',
    expected: 'Wireless Mouse',
    description: 'Product name with tax keywords'
  },
  {
    name: 'Test 4: Product code in parentheses',
    input: 'Samsung Galaxy S21 (SM12345) 1 25000.00',
    expected: 'Samsung Galaxy S21',
    description: 'Product name with model code and price'
  },
  {
    name: 'Test 5: Currency symbols mixed in',
    input: 'Sony Headphones ₹2999 1 2999.00',
    expected: 'Sony Headphones',
    description: 'Product name with currency symbols'
  },
  {
    name: 'Test 6: Multiple spaces and formatting',
    input: 'Apple  Watch   Series  7  1  42000.00',
    expected: 'Apple Watch Series 7',
    description: 'Product with irregular spacing and price'
  },
  {
    name: 'Test 7: Decimal price directly attached',
    input: 'Phillips Air Fryer 4500.99',
    expected: 'Phillips Air Fryer',
    description: 'Product with decimal price no space'
  },
  {
    name: 'Test 8: Clean product name (no contamination)',
    input: 'Boat Earbuds Pro',
    expected: 'Boat Earbuds Pro',
    description: 'Already clean product name'
  }
];

// Run tests
let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  console.log(`\n${test.name}`);
  console.log(`Description: ${test.description}`);
  console.log(`Input:       "${test.input}"`);
  console.log(`Expected:    "${test.expected}"`);
  
  // Call the cleaning method
  const result = ocrService.cleanFlipkartProductName(test.input);
  
  console.log(`Result:      "${result}"`);
  
  // Check if result matches expected (case-insensitive, trim whitespace)
  const resultClean = result.trim().toLowerCase();
  const expectedClean = test.expected.trim().toLowerCase();
  
  if (resultClean === expectedClean) {
    console.log('✅ PASS');
    passed++;
  } else {
    console.log('❌ FAIL');
    console.log(`   Difference: Expected "${expectedClean}" but got "${resultClean}"`);
    failed++;
  }
});

// Summary
console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║  TEST SUMMARY                                                  ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log(`Total Tests: ${testCases.length}`);
console.log(`Passed: ${passed} ✅`);
console.log(`Failed: ${failed} ${failed > 0 ? '❌' : ''}`);
console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%\n`);

if (failed === 0) {
  console.log('🎉 ALL TESTS PASSED! Product name cleaning is working correctly.\n');
  process.exit(0);
} else {
  console.log('⚠️  SOME TESTS FAILED. Review the implementation.\n');
  process.exit(1);
}
