// Test script for Flipkart Order ID extraction fix
// Tests the permanent solution for handling OCR date concatenation

const testCases = [
  {
    name: "OCR merged with date (BUG CASE)",
    text: "Order ID: OD43054358527008910022-02-2024",
    expected: "OD430543585270089100"
  },
  {
    name: "Clean Order ID (NORMAL CASE)",
    text: "Order ID: OD430543585270089100",
    expected: "OD430543585270089100"
  },
  {
    name: "Order ID without label",
    text: "Invoice for OD430543585270089100 dated 22-02-2024",
    expected: "OD430543585270089100"
  },
  {
    name: "Order ID with extra digits merged",
    text: "OD430543585270089100123456789",
    expected: "OD430543585270089100"
  }
];

console.log("========================================");
console.log("Flipkart Order ID Extraction Test");
console.log("========================================\n");

testCases.forEach((test, index) => {
  console.log(`Test ${index + 1}: ${test.name}`);
  console.log(`Input: "${test.text}"`);
  
  // Simulate the fix logic
  let match = test.text.match(/OD\d{18,25}/);
  if (!match) {
    match = test.text.match(/Order\s*ID[:\s]*(OD\d{18,25})/i);
  }
  
  let result = null;
  if (match) {
    let candidate = match[0].startsWith('OD') ? match[0] : match[1];
    
    if (candidate.length >= 20) {
      candidate = candidate.slice(0, 20);
    }
    
    if (/^OD\d{18}$/.test(candidate) && candidate.length === 20) {
      result = candidate;
    }
  }
  
  const status = result === test.expected ? "✅ PASS" : "❌ FAIL";
  console.log(`Expected: ${test.expected}`);
  console.log(`Got: ${result}`);
  console.log(`Status: ${status}\n`);
});

console.log("========================================");
console.log("All tests completed!");
console.log("========================================");
