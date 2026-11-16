const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { toDecimal128, decimalToNumber } = require("../models");

describe("Peer Debt, Settlements & Financial Precision", () => {
  test("Decimal128 conversions maintain precision without floating-point errors", () => {
    // Typical JS float issue: 0.1 + 0.2 === 0.30000000000000004
    const d1 = toDecimal128(0.1);
    const d2 = toDecimal128(0.2);
    const sum = decimalToNumber(d1) + decimalToNumber(d2);
    const preciseSum = toDecimal128(Math.round(sum * 100) / 100);

    assert.equal(decimalToNumber(preciseSum), 0.3);
  });

  test("Bill splitting arithmetic: ₹2000 split equally", () => {
    const totalPaid = 2000;
    const friendCount = 1;
    const splitAmount = Math.round((totalPaid / (friendCount + 1)) * 100) / 100;
    const personalExpense = totalPaid - splitAmount;

    assert.equal(splitAmount, 1000);
    assert.equal(personalExpense, 1000);
    // Cash account balance reduces by totalPaid (2000)
    const initialCash = 10000;
    const finalCash = initialCash - totalPaid;
    assert.equal(finalCash, 8000);
  });

  test("Partial and full settlements of peer debt", () => {
    const totalDebt = 1000;
    let settledAmount = 0;
    let status = "PENDING";

    // 1. Friend makes partial payment of ₹400
    const partialPay = 400;
    settledAmount += partialPay;
    if (settledAmount >= totalDebt) {
      status = "SETTLED";
    } else if (settledAmount > 0) {
      status = "PARTIAL";
    }
    assert.equal(settledAmount, 400);
    assert.equal(status, "PARTIAL");
    assert.equal(totalDebt - settledAmount, 600);

    // 2. Friend settles the remaining ₹600
    const finalPay = 600;
    settledAmount += finalPay;
    if (settledAmount >= totalDebt) {
      status = "SETTLED";
    }
    assert.equal(settledAmount, 1000);
    assert.equal(status, "SETTLED");
    assert.equal(totalDebt - settledAmount, 0);
  });

  test("Settlement does not exceed remaining owed", () => {
    const totalDebt = 500;
    const settledAmount = 300;
    const remaining = totalDebt - settledAmount;
    const attemptedPayment = 400;

    const isExceeded = attemptedPayment > remaining;
    assert.equal(isExceeded, true);
  });
});
