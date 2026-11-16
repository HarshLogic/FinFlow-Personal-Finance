const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { parseTransactionSMS, cleanMerchant, guessCategory } = require("../utils/transactionParser");

describe("Transaction SMS Parser", () => {
  test("Extracts UPI debit to Swiggy correctly", () => {
    const sms = "Rs.450.00 debited from your account via UPI to Swiggy on 15-11-2026. Ref: 432109876543";
    const result = parseTransactionSMS(sms);

    assert.equal(result.success, true);
    assert.equal(result.data.amount, 450);
    assert.equal(result.data.merchant, "Swiggy");
    assert.equal(result.data.type, "EXPENSE");
    assert.equal(result.data.paymentMethod, "UPI");
    assert.equal(result.data.category, "Food");
    assert.equal(result.data.date, "2026-11-15");
    assert.equal(result.data.externalReference, "432109876543");
    assert.equal(result.data.confidence, "HIGH");
  });

  test("Extracts HDFC Credit Card swipe at Starbucks", () => {
    const sms = "Alert: You've spent INR 780.50 on your HDFC Bank Credit Card at Starbucks on 10/11/2026. Avl Bal: INR 45,000. Ref 987654";
    const result = parseTransactionSMS(sms);

    assert.equal(result.success, true);
    assert.equal(result.data.amount, 780.5);
    assert.equal(result.data.merchant, "Starbucks");
    assert.equal(result.data.type, "EXPENSE");
    assert.equal(result.data.paymentMethod, "CREDIT_CARD");
    assert.equal(result.data.category, "Dining");
    assert.equal(result.data.date, "2026-11-10");
    assert.equal(result.data.externalReference, "987654");
  });

  test("Extracts salary/credit notification correctly", () => {
    const sms = "Account credited with ₹45,000.00 on 01-11-2026 by NEFT from Infotech Corp. UTR: INF789456123";
    const result = parseTransactionSMS(sms);

    assert.equal(result.success, true);
    assert.equal(result.data.amount, 45000);
    assert.equal(result.data.type, "INCOME");
    assert.equal(result.data.paymentMethod, "NEFT");
    assert.equal(result.data.date, "2026-11-01");
    assert.equal(result.data.externalReference, "INF789456123");
  });

  test("Extracts ride hailing to Uber via UPI", () => {
    const sms = "Paid Rs 340 to Uber via UPI on 12-11-2026. UPI Ref 567890.";
    const result = parseTransactionSMS(sms);

    assert.equal(result.success, true);
    assert.equal(result.data.amount, 340);
    assert.equal(result.data.merchant, "Uber");
    assert.equal(result.data.type, "EXPENSE");
    assert.equal(result.data.category, "Travel");
  });

  test("Applies user custom merchant overrides", () => {
    const customMappings = { "local kirana": "Food", "tech gadget store": "Shopping" };
    const sms = "Debited Rs. 1,200 for Tech Gadget Store on 05-11-2026 via UPI";
    const result = parseTransactionSMS(sms, customMappings);

    assert.equal(result.data.amount, 1200);
    assert.equal(result.data.category, "Shopping");
  });

  test("Gracefully handles ambiguous or incomplete SMS", () => {
    const sms = "Random text without bank information or currency numbers";
    const result = parseTransactionSMS(sms);

    assert.equal(result.success, true);
    assert.equal(result.data.amount, 0);
    assert.equal(result.data.confidence, "LOW");
    assert.ok(result.data.warnings.length > 0);
  });
});
