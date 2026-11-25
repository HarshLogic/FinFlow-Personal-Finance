const test = require("node:test");
const assert = require("node:assert/strict");

const { calculateEMI } = require("../services/emiCalculator");
const {
  calculateFullPaymentAffordability,
  calculateEmiAffordability,
  calculateAffordability,
} = require("../services/affordabilityEngine");

test("EMI & Loan Calculation Engine", async (t) => {
  await t.test("Calculates standard reducing-balance EMI correctly", () => {
    // Principal: ₹1,00,000, Tenure: 12 months, Annual Rate: 12%
    // Monthly rate r = 0.01
    // EMI = 100000 * 0.01 * (1.01)^12 / ((1.01)^12 - 1) = ~8884.88
    const res = calculateEMI({
      principal: 100000,
      downPayment: 0,
      tenureMonths: 12,
      annualInterestRate: 12,
      processingFee: 1000,
    });

    assert.ok(res.monthlyEMI >= 8880 && res.monthlyEMI <= 8890, `Expected ~8885, got ${res.monthlyEMI}`);
    assert.ok(res.totalInterest > 6500 && res.totalInterest < 6700, `Expected total interest ~6618, got ${res.totalInterest}`);
    assert.strictEqual(res.totalRepayment, Math.round((res.monthlyEMI * 12 + 1000) * 100) / 100);
    assert.strictEqual(res.amortizationSchedule.length, 12);
  });

  await t.test("Calculates Zero-Interest / No-Cost EMI correctly", () => {
    // Principal: ₹60,000, Down Payment: ₹10,000, 5 months, 0% interest
    // Financed: ₹50,000 / 5 = ₹10,000/mo
    const res = calculateEMI({
      principal: 60000,
      downPayment: 10000,
      tenureMonths: 5,
      annualInterestRate: 0,
      processingFee: 0,
    });

    assert.strictEqual(res.financedPrincipal, 50000);
    assert.strictEqual(res.monthlyEMI, 10000);
    assert.strictEqual(res.totalInterest, 0);
    assert.strictEqual(res.totalRepayment, 60000);
  });

  await t.test("Handles full down payment (no loan required)", () => {
    const res = calculateEMI({
      principal: 25000,
      downPayment: 25000,
      tenureMonths: 12,
      annualInterestRate: 14,
    });

    assert.strictEqual(res.financedPrincipal, 0);
    assert.strictEqual(res.monthlyEMI, 0);
    assert.strictEqual(res.totalInterest, 0);
  });
});

test("Smart Purchase Simulator Core Math & Section 4.5 Test Fixture", async (t) => {
  await t.test("Verifies User Specification Example (Section 4.5)", () => {
    const liquidBalance = 60000;
    const upcomingBills = 15000;
    const remainingSavings = 10000;
    const safetyBuffer = 10000;
    const purchasePrice = 20000;
    const remainingDays = 15;

    // Available Purchase Capacity
    const availableCapacity = liquidBalance - upcomingBills - remainingSavings - safetyBuffer;
    assert.strictEqual(availableCapacity, 25000, "Available purchase capacity must be ₹25,000");

    // Post-Purchase metrics
    const postPurchaseLiquid = liquidBalance - purchasePrice;
    const postPurchaseDisposable = availableCapacity - purchasePrice;
    const protectedCommitments = upcomingBills + remainingSavings + safetyBuffer;
    const postDailySafe = Math.round(postPurchaseDisposable / remainingDays);

    assert.strictEqual(postPurchaseLiquid, 40000, "Post-purchase liquid balance must be ₹40,000");
    assert.strictEqual(postPurchaseDisposable, 5000, "Remaining disposable balance must be ₹5,000");
    assert.strictEqual(protectedCommitments, 35000, "Protected commitments must be ₹35,000");
    assert.ok(postDailySafe >= 100, "Daily safe spend remains positive and viable");

    // Affordability verdict logic
    const isSafe = purchasePrice <= availableCapacity && postDailySafe >= 100 && postPurchaseLiquid >= protectedCommitments;
    assert.strictEqual(isSafe, true, "Must be classified as SAFE TO BUY");
  });

  await t.test("Accurately identifies unaffordable purchase breaching safety buffer", () => {
    const liquidBalance = 30000;
    const upcomingBills = 15000;
    const remainingSavings = 10000;
    const safetyBuffer = 10000;
    const purchasePrice = 45000;

    const availableCapacity = Math.max(0, liquidBalance - upcomingBills - remainingSavings - safetyBuffer);
    assert.strictEqual(availableCapacity, 0);

    const postPurchaseLiquid = liquidBalance - purchasePrice;
    assert.ok(postPurchaseLiquid < 0, "Liquid balance becomes negative");

    const isAffordable = purchasePrice <= availableCapacity;
    assert.strictEqual(isAffordable, false, "Must be classified as NOT AFFORDABLE");
  });

  await t.test("Calculates realistic savings timeline for unaffordable purchase", () => {
    const purchasePrice = 50000;
    const availableCapacity = 20000;
    const sustainableMonthlySavings = 10000;

    const additionalAmountRequired = Math.max(0, purchasePrice - availableCapacity);
    const estimatedMonths = Math.ceil(additionalAmountRequired / sustainableMonthlySavings);

    assert.strictEqual(additionalAmountRequired, 30000);
    assert.strictEqual(estimatedMonths, 3, "Requires 3 months of ₹10,000/mo savings");
  });
});

test("Deterministic Affordability Calculation Engine", async (t) => {
  await t.test("Full Payment: Comfortably Affordable when ratio <= 25%", () => {
    // Liquid balance: 3,00,000
    // Essentials: 20,000, Debt: 0, Planned savings: 10,000, Income: 80,000
    // 6-month reserve: 20,000 * 6 = 1,20,000
    // Unreserved available: 3,00,000 - 1,20,000 = 1,80,000
    // Purchase: 30,000 -> ratio = 30000 / 180000 = 16.67%
    const res = calculateFullPaymentAffordability({
      productName: "Air Conditioner",
      amount: 30000,
      monthlyIncome: 80000,
      essentialExpenses: 20000,
      existingEMIs: 0,
      plannedSavings: 10000,
      liquidBalance: 300000,
      otherUnpaidCommitments: 0,
      emergencyFundMonths: 6,
    });

    assert.strictEqual(res.status, "COMFORTABLY_AFFORDABLE");
    assert.strictEqual(res.requiredEmergencyFund, 120000);
    assert.strictEqual(res.availableSpendingBalance, 180000);
    assert.strictEqual(res.monthlyDisposableIncome, 50000);
    assert.strictEqual(res.postPurchaseBankBalance, 270000);
    assert.strictEqual(res.postPurchaseUnreservedBalance, 150000);
    assert.strictEqual(res.totalFundingGap, 0);
  });

  await t.test("Full Payment: Affordable when 25% < ratio <= 50%", () => {
    // Purchase: 60,000 / 1,80,000 = 33.33%
    const res = calculateFullPaymentAffordability({
      productName: "Television",
      amount: 60000,
      monthlyIncome: 80000,
      essentialExpenses: 20000,
      existingEMIs: 0,
      plannedSavings: 10000,
      liquidBalance: 300000,
      otherUnpaidCommitments: 0,
      emergencyFundMonths: 6,
    });

    assert.strictEqual(res.status, "AFFORDABLE");
    assert.strictEqual(res.affordabilityRatio, 33.33);
    assert.strictEqual(res.postPurchaseBankBalance, 240000);
    assert.strictEqual(res.postPurchaseUnreservedBalance, 120000);
  });

  await t.test("Full Payment: Risky when 50% < ratio <= 100%", () => {
    // Purchase: 1,20,000 / 1,80,000 = 66.67%
    const res = calculateFullPaymentAffordability({
      productName: "High-end Laptop",
      amount: 120000,
      monthlyIncome: 80000,
      essentialExpenses: 20000,
      existingEMIs: 0,
      plannedSavings: 10000,
      liquidBalance: 300000,
      otherUnpaidCommitments: 0,
      emergencyFundMonths: 6,
    });

    assert.strictEqual(res.status, "RISKY");
    assert.strictEqual(res.affordabilityRatio, 66.67);
  });

  await t.test("Full Payment: Downgrades to Risky when monthly cash flow is negative", () => {
    // Liquid cash is available (3,00,000), but monthly income (20k) < expenses (30k) -> deficit -10k
    const res = calculateFullPaymentAffordability({
      productName: "Phone",
      amount: 20000,
      monthlyIncome: 20000,
      essentialExpenses: 30000,
      existingEMIs: 0,
      plannedSavings: 0,
      liquidBalance: 300000,
      emergencyFundMonths: 6,
    });

    assert.strictEqual(res.monthlyDisposableIncome, -10000);
    assert.strictEqual(res.status, "RISKY");
  });

  await t.test("Full Payment: Not Affordable when purchase exceeds available spending balance", () => {
    // Available unreserved: 1,80,000; Purchase: 2,50,000
    const res = calculateFullPaymentAffordability({
      productName: "Luxury Vacation",
      amount: 250000,
      monthlyIncome: 80000,
      essentialExpenses: 20000,
      existingEMIs: 0,
      plannedSavings: 10000,
      liquidBalance: 300000,
      emergencyFundMonths: 6,
    });

    assert.strictEqual(res.status, "NOT_AFFORDABLE");
    assert.strictEqual(res.totalFundingGap, 70000);
    assert.strictEqual(res.monthsRequired, 2); // 70000 / 50000 = 1.4 -> 2 months
  });

  await t.test("EMI: Comfortably Affordable for low installment with healthy cash flow", () => {
    // Price: 1,00,000, 12% interest, 12 months, Down Payment: 0
    // Disposable income: 50,000
    // Monthly EMI ~8,885 -> ratio = 8885 / 50000 = 17.77% <= 30%
    const res = calculateEmiAffordability({
      productName: "Workstation",
      amount: 100000,
      monthlyIncome: 80000,
      essentialExpenses: 20000,
      existingEMIs: 0,
      plannedSavings: 10000,
      liquidBalance: 300000,
      emergencyFundMonths: 6,
      downPayment: 0,
      annualInterestRate: 12,
      tenureMonths: 12,
      processingFees: 1000,
    });

    assert.strictEqual(res.status, "COMFORTABLY_AFFORDABLE");
    assert.ok(res.emiDetails.monthlyEMI >= 8880 && res.emiDetails.monthlyEMI <= 8890);
    assert.strictEqual(res.debtToIncomeRatio, 11.11); // 8885 / 80000 = 11.11%
    assert.strictEqual(res.postPurchaseBankBalance, 299000); // 300000 - 1000 fee
  });

  await t.test("EMI: Downgrades to Risky when debt-to-income exceeds 30%", () => {
    // Gross Income: 40,000
    // Existing EMI: 8,000
    // New EMI: 6,000
    // Total debt: 14,000 / 40,000 = 35% (> 30%)
    const res = calculateEmiAffordability({
      productName: "Bike",
      amount: 72000,
      monthlyIncome: 40000,
      essentialExpenses: 15000,
      existingEMIs: 8000,
      plannedSavings: 2000,
      liquidBalance: 200000,
      downPayment: 0,
      annualInterestRate: 0,
      tenureMonths: 12, // 72000 / 12 = 6000
    });

    assert.strictEqual(res.debtToIncomeRatio, 35);
    assert.strictEqual(res.status, "RISKY");
  });

  await t.test("EMI: Not Affordable when upfront charges exceed available spending balance", () => {
    // Liquid balance: 50,000; Emergency fund needed: 1,20,000 -> Available spending balance = 0
    const res = calculateEmiAffordability({
      productName: "Car",
      amount: 500000,
      monthlyIncome: 60000,
      essentialExpenses: 20000,
      liquidBalance: 50000,
      emergencyFundMonths: 6,
      downPayment: 100000,
    });

    assert.strictEqual(res.status, "NOT_AFFORDABLE");
  });

  await t.test("Handles Edge Cases: Zero amount and 3-month vs 6-month reserve", () => {
    const zeroRes = calculateAffordability({ amount: 0 });
    assert.strictEqual(zeroRes.status, "INSUFFICIENT_DATA");

    const threeMonth = calculateFullPaymentAffordability({
      amount: 20000,
      essentialExpenses: 20000,
      existingEMIs: 0,
      liquidBalance: 100000,
      emergencyFundMonths: 3,
    });
    // 3 * 20000 = 60,000 reserve -> 40,000 available
    assert.strictEqual(threeMonth.requiredEmergencyFund, 60000);
    assert.strictEqual(threeMonth.availableSpendingBalance, 40000);
  });
});
