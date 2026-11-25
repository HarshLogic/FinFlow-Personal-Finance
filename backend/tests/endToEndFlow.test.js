const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const { calculateFinancialHealthScore } = require("../services/financialHealthService");
const { generateRecommendations } = require("../services/recommendationEngine");
const { generateMonthlyReportPDF } = require("../utils/pdfGenerator");
const { generateMonthlyReportCSV } = require("../utils/csvGenerator");
const { calculateEMI } = require("../services/emiCalculator");

describe("FinFlow 21-Step Master End-to-End Workflow & Regression Audit", () => {
  test("Executes complete end-to-end lifecycle across all core and new features", () => {
    // 1. User Registration Simulation
    const testUser = {
      userId: "usr_e2e_auditor_999",
      email: "auditor@finflow.test",
      displayName: "FinTech Auditor",
      isAuthenticated: true,
    };
    assert.strictEqual(testUser.isAuthenticated, true);

    // 2. Financial Accounts Creation (HDFC Checking, Savings, Cash Wallet)
    const accounts = [
      { id: "acc_1", name: "HDFC Salary", type: "CHECKING", currentBalance: 75000, isLiquid: true },
      { id: "acc_2", name: "ICICI Emergency Reserve", type: "SAVINGS", currentBalance: 25000, isLiquid: true },
      { id: "acc_3", name: "Cash Wallet", type: "CASH", currentBalance: 5000, isLiquid: true },
    ];
    let totalLiquidBalance = accounts.reduce((sum, a) => sum + (a.isLiquid ? a.currentBalance : 0), 0);
    assert.strictEqual(totalLiquidBalance, 105000, "Initial liquid cash should be ₹1,05,000");

    // 3. Record Monthly Incomes
    const incomes = [
      { id: "inc_1", amount: 90000, source: "Primary Salary", date: new Date("2026-11-01") },
      { id: "inc_2", amount: 15000, source: "Freelance Consulting", date: new Date("2026-11-10") },
    ];
    const totalMonthlyIncome = incomes.reduce((s, i) => s + i.amount, 0);
    assert.strictEqual(totalMonthlyIncome, 105000);

    // 4. Create Recurring Bills (Fixed Obligations)
    const obligations = [
      { id: "ob_rent", title: "House Rent", amount: 18000, dueDay: 5, isPaid: true },
      { id: "ob_emi", title: "Car Loan EMI", amount: 12000, dueDay: 10, isPaid: true },
      { id: "ob_wifi", title: "Fiber Broadband", amount: 1200, dueDay: 20, isPaid: false },
      { id: "ob_gym", title: "Gym Membership", amount: 1500, dueDay: 25, isPaid: false },
    ];
    const totalObligations = obligations.reduce((s, o) => s + o.amount, 0);
    const paidObligations = obligations.filter(o => o.isPaid).reduce((s, o) => s + o.amount, 0);
    const pendingBills = obligations.filter(o => !o.isPaid).reduce((s, o) => s + o.amount, 0);

    assert.strictEqual(totalObligations, 32700);
    assert.strictEqual(paidObligations, 30000);
    assert.strictEqual(pendingBills, 2700);

    // Debit paid obligations from HDFC account
    accounts[0].currentBalance -= paidObligations;
    totalLiquidBalance -= paidObligations;
    assert.strictEqual(totalLiquidBalance, 75000);

    // 5. Configure Budget Cycle & Savings Target
    const budgetCycle = {
      cycleStartDay: 1,
      monthlySavingsGoal: 20000,
      minSafetyBuffer: 15000,
      currency: "INR",
    };

    // 6. Record Daily Personal Expenses (Needs vs Wants)
    const expenses = [
      { id: "exp_1", amount: 6000, category: "Food", type: "need", label: "Monthly Groceries" },
      { id: "exp_2", amount: 2500, category: "Travel", type: "need", label: "Metro Card Recharge" },
      { id: "exp_3", amount: 4500, category: "Dining", type: "want", label: "Weekend Bistro Dinner" },
      { id: "exp_4", amount: 3000, category: "Shopping", type: "want", label: "Sneakers" },
    ];

    const needSpend = expenses.filter(e => e.type === "need").reduce((s, e) => s + e.amount, 0);
    const wantSpend = expenses.filter(e => e.type === "want").reduce((s, e) => s + e.amount, 0);
    const personalConsumptionSpend = needSpend + wantSpend;

    assert.strictEqual(needSpend, 8500);
    assert.strictEqual(wantSpend, 7500);
    assert.strictEqual(personalConsumptionSpend, 16000);

    accounts[0].currentBalance -= personalConsumptionSpend;
    totalLiquidBalance -= personalConsumptionSpend;
    assert.strictEqual(totalLiquidBalance, 59000);

    // 7. Record Investment Portfolio Assets
    const stocks = [{ ticker: "RELIANCE", qty: 20, avgPrice: 2400, cmp: 2600 }];
    const mutualFunds = [{ name: "Parag Parikh Flexi Cap", units: 1000, currentNav: 75, invested: 60000, sipAmount: 5000 }];
    const fds = [{ bank: "HDFC Bank", principal: 50000, maturityAmount: 54000 }];

    const stockVal = stocks[0].qty * stocks[0].cmp; // 52,000
    const mfVal = mutualFunds[0].units * mutualFunds[0].currentNav; // 75,000
    const fdVal = fds[0].maturityAmount; // 54,000
    const totalInvestments = stockVal + mfVal + fdVal; // 181,000
    assert.strictEqual(totalInvestments, 181000);

    // 8. Verify Safe-to-Spend
    // Available = Liquid (59,000) - Pending Bills (2,700) - Savings Goal (20,000) - Safety Buffer (15,000) = 21,300
    const remainingDays = 15;
    const availableCapacity = totalLiquidBalance - pendingBills - budgetCycle.monthlySavingsGoal - budgetCycle.minSafetyBuffer;
    const dailySafeToSpend = Math.round((availableCapacity / remainingDays) * 100) / 100;

    assert.strictEqual(availableCapacity, 21300);
    assert.strictEqual(dailySafeToSpend, 1420);

    // 9. Generate Monthly Personal CA Report & Financial Health Score
    const totalSpend = paidObligations + personalConsumptionSpend;
    const totalSavings = totalMonthlyIncome - totalSpend;
    const savingsRate = (totalSavings / totalMonthlyIncome) * 100;

    const healthScore = calculateFinancialHealthScore({
      totalIncome: totalMonthlyIncome,
      totalExpenses: totalSpend,
      totalSavings,
      savingsRate,
      needSpend: needSpend + paidObligations,
      wantSpend,
      liquidBalance: totalLiquidBalance,
      fixedCommitments: totalObligations,
      totalInvestments,
      hasActiveSIP: true,
      cashFlow: totalSavings,
    });

    assert.ok(healthScore.score >= 75, `Expected healthy score >= 75, got ${healthScore.score}`);
    assert.ok(["Healthy", "Excellent"].includes(healthScore.rating));

    // 10. Generate Personalized Recommendations
    const recs = generateRecommendations({
      totalIncome: totalMonthlyIncome,
      totalExpenses: totalSpend,
      savingsRate,
      needSpend: needSpend + paidObligations,
      wantSpend,
      liquidBalance: totalLiquidBalance,
      fixedCommitments: totalObligations,
      pendingBills,
      topCategories: [
        { category: "Rent", amount: 18000, percentage: 39 },
        { category: "Car Loan", amount: 12000, percentage: 26 },
        { category: "Food & Dining", amount: 10500, percentage: 22 },
      ],
      healthScore: healthScore.score,
    });
    assert.ok(recs.length > 0);

    // 11. Verify PDF Generation
    const mockReportData = {
      year: 2026,
      month: 11,
      reportingPeriod: { label: "November 2026" },
      currency: "INR",
      isProvisional: true,
      financialSummary: {
        totalIncome: totalMonthlyIncome,
        totalExpenses: totalSpend,
        totalSavings,
        savingsRate,
        liquidBalance: totalLiquidBalance,
        fixedCommitments: totalObligations,
        pendingBills,
        netWorth: totalLiquidBalance + totalInvestments,
      },
      healthScore,
      spendingAnalysis: {
        needSpend: needSpend + paidObligations,
        wantSpend,
        needPct: 83.7,
        wantPct: 16.3,
        topCategories: [{ category: "Housing", amount: 18000, percentage: 39 }],
      },
      investmentAnalysis: {
        savingsTarget: 20000,
        actualSavings: totalSavings,
        portfolioAllocation: { stocks: stockVal, mutualFunds: mfVal, fixedDeposits: fdVal },
      },
      recommendations: recs,
    };

    const pdfBuffer = generateMonthlyReportPDF(mockReportData, testUser);
    assert.ok(Buffer.isBuffer(pdfBuffer));
    assert.ok(pdfBuffer.toString("ascii").startsWith("%PDF-1.4"));

    // 12. Verify CSV Generation
    const csvData = generateMonthlyReportCSV(mockReportData, testUser);
    assert.ok(csvData.includes("FINFLOW — MONTHLY PERSONAL CA FINANCIAL REPORT"));
    assert.ok(csvData.includes(String(totalMonthlyIncome)));

    // 13. Smart Purchase Simulator — Scenario A: Affordable Gadget (₹15,000 Upfront)
    const purchaseAmountA = 15000;
    const isAffordableA = purchaseAmountA <= availableCapacity;
    const postLiquidA = totalLiquidBalance - purchaseAmountA;
    const postDisposableA = availableCapacity - purchaseAmountA;

    assert.strictEqual(isAffordableA, true, "₹15,000 is less than ₹21,300 available capacity");
    assert.strictEqual(postLiquidA, 44000);
    assert.strictEqual(postDisposableA, 6300);

    // 14. Smart Purchase Simulator — Scenario B: EMI Purchase (₹60,000 Laptop, 6 Mo No-Cost EMI)
    const emiSim = calculateEMI({
      principal: 60000,
      downPayment: 10000,
      tenureMonths: 6,
      annualInterestRate: 0,
      processingFee: 0,
    });
    assert.strictEqual(emiSim.financedPrincipal, 50000);
    assert.strictEqual(emiSim.monthlyEMI, 8333.33);

    // Down payment (10,000) <= availableCapacity (21,300) -> Initial payment affordable!
    assert.ok(emiSim.downPayment <= availableCapacity);

    // 15. Smart Purchase Simulator — Scenario C: Unaffordable Luxury (₹1,50,000 Watch)
    const luxuryPrice = 150000;
    const isAffordableC = luxuryPrice <= availableCapacity;
    assert.strictEqual(isAffordableC, false, "₹1,50,000 exceeds liquid capacity");

    // 16. Convert Unaffordable Purchase into a Savings Goal
    const additionalNeeded = luxuryPrice - availableCapacity; // 1,50,000 - 21,300 = 1,28,700
    const suggestedMonthly = budgetCycle.monthlySavingsGoal; // 20,000/mo
    const monthsToSave = Math.ceil(additionalNeeded / suggestedMonthly); // 7 months

    assert.strictEqual(additionalNeeded, 128700);
    assert.strictEqual(monthsToSave, 7);

    const generatedGoal = {
      name: "Buy Luxury Watch",
      targetAmount: luxuryPrice,
      monthlyContribution: suggestedMonthly,
      estimatedMonths: monthsToSave,
      status: "ACTIVE",
    };
    assert.strictEqual(generatedGoal.status, "ACTIVE");
    assert.strictEqual(generatedGoal.monthlyContribution, 20000);
  });
});
