const test = require("node:test");
const assert = require("node:assert/strict");

const { calculateFinancialHealthScore } = require("../services/financialHealthService");
const { generateRecommendations } = require("../services/recommendationEngine");
const { generateMonthlyReportPDF } = require("../utils/pdfGenerator");
const { generateMonthlyReportCSV, sanitizeCSVCell } = require("../utils/csvGenerator");

test("Financial Health Score Calculation", async (t) => {
  await t.test("Calculates optimal health score for disciplined financial profile", () => {
    const score = calculateFinancialHealthScore({
      totalIncome: 100000,
      totalExpenses: 40000,
      totalSavings: 60000,
      savingsRate: 60,
      needSpend: 25000,
      wantSpend: 15000,
      liquidBalance: 250000, // 10 months essential spend
      fixedCommitments: 20000, // 20% of income
      totalInvestments: 25000,
      hasActiveSIP: true,
      cashFlow: 35000,
    });

    assert.ok(score.score >= 85, `Expected score >= 85, got ${score.score}`);
    assert.strictEqual(score.breakdown.savingsPerformance.score, 25);
    assert.strictEqual(score.breakdown.emergencyFundCoverage.score, 20);
    assert.strictEqual(score.breakdown.debtAndObligations.score, 15);
    assert.strictEqual(score.breakdown.investmentConsistency.score, 10);
    assert.strictEqual(score.breakdown.cashFlowStability.score, 10);
  });

  await t.test("Handles zero income and negative cash flow gracefully", () => {
    const score = calculateFinancialHealthScore({
      totalIncome: 0,
      totalExpenses: 30000,
      totalSavings: -30000,
      savingsRate: 0,
      needSpend: 20000,
      wantSpend: 10000,
      liquidBalance: 15000, // less than 1 month
      fixedCommitments: 15000,
      totalInvestments: 0,
      hasActiveSIP: false,
      cashFlow: -30000,
    });

    assert.ok(score.score <= 45, `Expected vulnerable score <= 45, got ${score.score}`);
    assert.ok(score.rating.includes("Vulnerable") || score.rating.includes("Risk"));
  });

  await t.test("Penalizes excessive discretionary (Want) spending (> 35% benchmark)", () => {
    const score = calculateFinancialHealthScore({
      totalIncome: 60000,
      totalExpenses: 55000,
      totalSavings: 5000,
      savingsRate: 8.3,
      needSpend: 20000,
      wantSpend: 35000, // 63% wants!
      liquidBalance: 30000,
      fixedCommitments: 15000,
      totalInvestments: 0,
      cashFlow: 5000,
    });

    assert.ok(score.breakdown.budgetDiscipline.score < 15, "Expected budget discipline penalty");
    assert.ok(score.breakdown.budgetDiscipline.reason.includes("Discretionary"));
  });
});

test("Personalized Recommendation Engine", async (t) => {
  await t.test("Triggers high-priority emergency fund recommendation when runway < 1 month", () => {
    const recs = generateRecommendations({
      totalIncome: 50000,
      totalExpenses: 35000,
      savingsRate: 30,
      needSpend: 25000,
      wantSpend: 10000,
      liquidBalance: 5000, // less than 1 month!
      fixedCommitments: 10000,
      pendingBills: 0,
    });

    const emergencyRec = recs.find(r => r.id.includes("EMERGENCY"));
    assert.ok(emergencyRec, "Should trigger emergency fund recommendation");
    assert.strictEqual(emergencyRec.priority, "HIGH");
    assert.ok(emergencyRec.suggestedAction.length > 0);
  });

  await t.test("Triggers recommendation when pending bills are outstanding", () => {
    const recs = generateRecommendations({
      totalIncome: 50000,
      totalExpenses: 30000,
      liquidBalance: 40000,
      fixedCommitments: 15000,
      pendingBills: 12000,
    });

    const billRec = recs.find(r => r.id === "REC_PENDING_BILLS");
    assert.ok(billRec, "Should trigger pending bills alert");
    assert.strictEqual(billRec.priority, "HIGH");
  });

  await t.test("Detects food delivery spike (> 25% of spend)", () => {
    const recs = generateRecommendations({
      totalIncome: 50000,
      totalExpenses: 30000,
      needSpend: 15000,
      wantSpend: 15000,
      topCategories: [
        { category: "Food & Dining", amount: 10000, percentage: 33.3 },
      ],
    });

    const foodRec = recs.find(r => r.id.includes("FOOD"));
    assert.ok(foodRec, "Should trigger food delivery reduction suggestion");
  });
});

test("PDF & CSV Exporters", async (t) => {
  const mockReport = {
    year: 2026,
    month: 11,
    reportingPeriod: { label: "November 2026" },
    currency: "INR",
    isProvisional: false,
    generatedAt: new Date("2026-11-25"),
    financialSummary: {
      totalIncome: 80000,
      totalExpenses: 45000,
      totalSavings: 35000,
      savingsRate: 43.75,
      liquidBalance: 120000,
      fixedCommitments: 20000,
      pendingBills: 5000,
      netWorth: 350000,
      netWorthChange: 35000,
    },
    healthScore: {
      score: 82,
      rating: "Healthy",
      color: "#3B82F6",
      breakdown: {
        savingsPerformance: { score: 25, reason: "Excellent" },
        budgetDiscipline: { score: 18, reason: "Good control" },
        emergencyFundCoverage: { score: 16, reason: "3.5 months" },
        debtAndObligations: { score: 12, reason: "Manageable" },
        investmentConsistency: { score: 7, reason: "SIP active" },
        cashFlowStability: { score: 8, reason: "Positive cash flow" },
      },
    },
    spendingAnalysis: {
      needSpend: 28000,
      wantSpend: 17000,
      needPct: 62.2,
      wantPct: 37.8,
      topCategories: [
        { category: "Rent", amount: 18000, percentage: 40 },
        { category: "Food", amount: 12000, percentage: 26.7 },
      ],
    },
    investmentAnalysis: {
      savingsTarget: 20000,
      actualSavings: 35000,
      targetCompletionPct: 100,
      portfolioAllocation: { stocks: 100000, mutualFunds: 80000, fixedDeposits: 50000 },
    },
    recommendations: [
      {
        priority: "MEDIUM",
        title: "Trim Dining Out",
        reason: "Dining is high",
        suggestedAction: "Limit to weekends",
        estimatedImpact: "Save ₹3,000/mo",
      },
    ],
    nextMonthActionPlan: [
      "Pay pending broadband bill",
      "Invest surplus into SIP",
    ],
  };

  await t.test("Generates valid standard PDF-1.4 binary buffer", () => {
    const pdfBuf = generateMonthlyReportPDF(mockReport, { email: "test@finflow.io" });
    assert.ok(Buffer.isBuffer(pdfBuf), "Must return a Buffer");
    assert.ok(pdfBuf.length > 500, "PDF buffer must contain content");

    const header = pdfBuf.toString("ascii", 0, 8);
    assert.ok(header.startsWith("%PDF-1.4"), `Expected PDF-1.4 header, got: ${header}`);

    const pdfString = pdfBuf.toString("ascii");
    assert.ok(pdfString.includes("%%EOF"), "PDF must terminate with %%EOF");
    assert.ok(pdfString.includes("FINFLOW"), "PDF must contain FinFlow branding");
  });

  await t.test("Mitigates formula injection in CSV cells", () => {
    assert.strictEqual(sanitizeCSVCell("=SUM(A1:A10)"), `"'=SUM(A1:A10)"`);
    assert.strictEqual(sanitizeCSVCell("+12345"), ` "'+12345"`.trim());
    assert.strictEqual(sanitizeCSVCell("-CMD|' /C calc'!A0"), ` "'-CMD|' /C calc'!A0"`.trim());
    assert.strictEqual(sanitizeCSVCell("@eval"), `"'@eval"`);
    assert.strictEqual(sanitizeCSVCell("Normal text"), `"Normal text"`);
  });

  await t.test("Generates structured CSV report string", () => {
    const csvStr = generateMonthlyReportCSV(mockReport, { email: "user@finflow.io" });
    assert.ok(typeof csvStr === "string");
    assert.ok(csvStr.includes("FINFLOW — MONTHLY PERSONAL CA FINANCIAL REPORT"));
    assert.ok(csvStr.includes("80000"));
    assert.ok(csvStr.includes("Healthy"));
  });
});
