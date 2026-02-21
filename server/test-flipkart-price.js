// Test script for Flipkart Price extraction fix
// Tests the permanent solution for strict Grand Total / Total extraction

const testCases = [
  {
    name: "Flipkart with Grand Total (CORRECT)",
    text: `
      Order ID: OD430543585270089100
      Product: Pigeon Favourite Electric Kettle
      Item Total: ₹1589
      Shipping: ₹50
      Grand Total ₹549.00
      Date: 22-02-2024
    `,
    expected: 549
  },
  {
    name: "Flipkart with Total (fallback)",
    text: `
      Order ID: OD430543585270089100
      Product: Pigeon Favourite Electric Kettle
      Item Price: ₹1589
      Discount: -1040
      Total ₹549
    `,
    expected: 549
  },
  {
    name: "Flipkart PDF complex case",
    text: `
      Tax Invoice
      Order ID: OD430543585270089100
      Pigeon Favourite Electric Kettle
      Category: Electric Jug (heater)
      
      Description  Qty  Rate  Amount
      Electric Kettle  1  1589  ₹1589
      
      Gross Amount: ₹1589
      Discount: -₹1040
      Taxable Value: ₹549
      CGST 9%: ₹49.41
      SGST 9%: ₹49.41
      
      Grand Total ₹647.82
    `,
    expected: 647.82
  },
  {
    name: "Flipkart with multiple ₹ values",
    text: `
      Order: OD430543585270089100
      MRP: ₹1999
      Selling Price: ₹1589
      You Save: ₹410
      Coupon Discount: -₹1040
      Final Amount
      Grand Total: ₹549.00
    `,
    expected: 549
  },
  {
    name: "Flipkart without currency symbol",
    text: `
      Order ID: OD430543585270089100
      Item Value: 1589
      Discount: 1040
      Grand Total 549.00
    `,
    expected: 549
  },
  {
    name: "Flipkart JPG (₹ missing in OCR)",
    text: `
      Order ID: OD430543585270089100
      Product: Pigeon Favourite Electric Kettle
      Item Total: 1589
      Shipping: 50
      Grand Total 549.00
      Date: 22-02-2024
    `,
    expected: 549
  }
];

console.log("========================================");
console.log("Flipkart Price Extraction Test");
console.log("========================================\n");

testCases.forEach((test, index) => {
  console.log(`Test ${index + 1}: ${test.name}`);
  
  // Simulate the NEW fix logic (v2 - normalize first)
  let detectedAmount = null;
  
  // Step 1: Normalize text - remove all currency symbols
  const cleanText = test.text.replace(/₹/g, '');
  
  // Step 2: Priority 1 - Grand Total
  let match = cleanText.match(/Grand\s*Total\s*[:\s]*([0-9.,]+)/i);
  if (match && match[1]) {
    const rawAmount = match[1].replace(/,/g, '');
    const amount = parseFloat(rawAmount);
    if (!isNaN(amount) && amount > 0) {
      detectedAmount = amount;
      console.log(`   Found via Grand Total: ₹${detectedAmount}`);
    }
  }
  
  // Step 3: Priority 2 - Total (if Grand Total not found)
  if (!detectedAmount) {
    match = cleanText.match(/\bTotal\s*[:\s]*([0-9.,]+)/i);
    if (match && match[1]) {
      const rawAmount = match[1].replace(/,/g, '');
      const amount = parseFloat(rawAmount);
      if (!isNaN(amount) && amount > 0) {
        detectedAmount = amount;
        console.log(`   Found via Total: ₹${detectedAmount}`);
      }
    }
  }
  
  const status = detectedAmount === test.expected ? "✅ PASS" : "❌ FAIL";
  console.log(`Expected: ₹${test.expected}`);
  console.log(`Got: ₹${detectedAmount}`);
  console.log(`Status: ${status}\n`);
});

console.log("========================================");
console.log("All tests completed!");
console.log("========================================");
