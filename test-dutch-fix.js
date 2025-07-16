// Quick test to verify Dutch number parsing
const dutchAmount = "89,99";
console.log("Dutch amount string:", dutchAmount);
console.log("parseFloat directly:", parseFloat(dutchAmount));
console.log("parseFloat with replace:", parseFloat(dutchAmount.replace(',', '.')));

// Test the actual code pattern
const testOrderData = {
  amount: "89,99",
  items: [
    { name: "Mouse", price: "89,99" }
  ]
};

if (typeof testOrderData.amount === 'string') {
  testOrderData.amount = parseFloat(testOrderData.amount.replace(',', '.'));
}

console.log("\nAfter fix:");
console.log("Amount:", testOrderData.amount);
console.log("Type:", typeof testOrderData.amount);