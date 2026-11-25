const {
  Income,
  Expense,
  Account,
  RecurringObligation,
  BudgetCycle,
  Stock,
  MutualFund,
  FixedDeposit,
  SplitExpense,
  MonthlyFinancialReport,
  User,
  FinancialFoundation,
  decimalToNumber,
} = require("../models");

const { calculateFinancialHealthScore } = require("./financialHealthService");
const { generateRecommendations } = require("./recommendationEngine");
const { generateMonthlyReportPDF } = require("../utils/pdfGenerator");
const { generateMonthlyReportCSV } = require("../utils/csvGenerator");

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Calculates start and end Date boundaries for a given year & 1-based month.
 */
function getMonthDateBounds(year, month) {
  const y = Number(year);
  const m = Number(month); // 1 - 12
  const startDate = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(y, m, 0, 23, 59, 59, 999);
  return { startDate, endDate, label: `${MONTH_NAMES[m - 1]} ${y}` };
}

/**
 * Generates or retrieves a reproducible Monthly Financial Report for a user.
 */
async function generateMonthlyReport(userId, year, month, forceRegenerate = false) {
  const y = Number(year);
  const m = Number(month);

  if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
    throw new Error("Invalid year or month supplied for report generation.");
  }

  // 1. Check existing snapshot
  if (!forceRegenerate) {
    const existing = await MonthlyFinancialReport.findOne({ userId, year: y, month: m });
    const now = new Date();
    const isCurrentMonth = y === now.getFullYear() && m === (now.getMonth() + 1);

    // If it's a completed past month and not marked outdated, return cached snapshot
    if (existing && !existing.isOutdated && !isCurrentMonth) {
      return existing;
    }
  }

  const { startDate, endDate, label } = getMonthDateBounds(y, m);
  const now = new Date();
  const isProvisional = (y === now.getFullYear() && m === (now.getMonth() + 1)) || (y > now.getFullYear()) || (y === now.getFullYear() && m > (now.getMonth() + 1));

  // 2. Fetch User & Configuration
  const [user, budgetCycle] = await Promise.all([
    User.findOne({ userId }).select("userId email displayName"),
    BudgetCycle.findOne({ userId }),
  ]);

  const currency = budgetCycle?.currency || "INR";
  const savingsGoal = decimalToNumber(budgetCycle?.monthlySavingsGoal);
  const safetyBuffer = decimalToNumber(budgetCycle?.minSafetyBuffer);

  // 3. Fetch Income & Expenses within this month
  const [incomes, expenses] = await Promise.all([
    Income.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }),
    Expense.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }),
  ]);

  // Aggregate Income
  let totalIncome = 0;
  for (const inc of incomes) {
    totalIncome += Number(inc.amount || 0);
  }

  // Aggregate Expenses (excluding explicit internal transfers or savings deposits)
  let totalExpenses = 0;
  let needSpend = 0;
  let wantSpend = 0;
  let reservedSavingsInExpenses = 0;
  const categoryTotals = {};
  const largestExpenses = [];

  for (const exp of expenses) {
    const amt = Number(exp.amount || 0);
    const cat = exp.category || "Other";

    // Exclude savings deposits from consumption expenses
    if (cat === "Savings") {
      reservedSavingsInExpenses += amt;
      continue;
    }

    totalExpenses += amt;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;

    if (exp.type === "need") {
      needSpend += amt;
    } else {
      wantSpend += amt;
    }

    largestExpenses.push({
      label: exp.label || exp.merchant || cat,
      amount: amt,
      category: cat,
      date: exp.date,
    });
  }

  // Sort top categories
  const topCategories = Object.keys(categoryTotals)
    .map(category => ({
      category,
      amount: Math.round(categoryTotals[category] * 100) / 100,
      percentage: totalExpenses > 0 ? (categoryTotals[category] / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Sort largest expenses
  largestExpenses.sort((a, b) => b.amount - a.amount);
  const topLargestExpenses = largestExpenses.slice(0, 5);

  // 4. Accounts & Liquid Balances
  const accounts = await Account.find({ userId, isActive: true });
  let liquidBalance = 0;
  if (accounts && accounts.length > 0) {
    for (const acc of accounts) {
      if (acc.isLiquid) {
        liquidBalance += decimalToNumber(acc.currentBalance);
      }
    }
  }
  liquidBalance = Math.round(liquidBalance * 100) / 100;

  // 5. Fixed Obligations & Bills
  const obligations = await RecurringObligation.find({ userId, isActive: true });
  let fixedCommitments = 0;
  let pendingBills = 0;
  let recurringSpend = 0;

  for (const ob of obligations) {
    const amt = decimalToNumber(ob.amount);
    fixedCommitments += amt;

    // Check if paid in this cycle
    const isPaidInMonth = ob.lastPaidDate && ob.lastPaidDate >= startDate && ob.lastPaidDate <= endDate;
    if (isPaidInMonth) {
      recurringSpend += amt;
    } else {
      pendingBills += amt;
    }
  }

  // 6. Investments: Stocks, Mutual Funds, Fixed Deposits
  const [stocks, mfs, fds] = await Promise.all([
    Stock.find({ userId }),
    MutualFund.find({ userId }),
    FixedDeposit.find({ userId }),
  ]);

  const stockValue = stocks.reduce((sum, s) => sum + (s.qty * (s.cmp || 0)), 0);
  const mfValue = mfs.reduce((sum, m) => sum + (m.units * (m.currentNav || 0)), 0);
  const fdMaturity = fds.reduce((sum, f) => sum + (f.maturityAmount || 0), 0);
  const activeSIPAmt = mfs.reduce((sum, m) => sum + Number(m.sipAmount || 0), 0);

  const totalInvestments = Math.round((stockValue + mfValue + fdMaturity) * 100) / 100;

  // 7. Outstanding Receivables (SplitExpense peer debts)
  const pendingSplits = await SplitExpense.find({
    userId,
    status: { $in: ["PENDING", "PARTIAL"] },
  });

  let outstandingReceivables = 0;
  for (const sp of pendingSplits) {
    const orig = decimalToNumber(sp.amount);
    const settled = decimalToNumber(sp.settledAmount);
    outstandingReceivables += Math.max(0, orig - settled);
  }
  outstandingReceivables = Math.round(outstandingReceivables * 100) / 100;

  // 8. Financial Summary Calculations
  totalIncome = Math.round(totalIncome * 100) / 100;
  totalExpenses = Math.round(totalExpenses * 100) / 100;
  const cashInflow = totalIncome;
  const cashOutflow = totalExpenses + reservedSavingsInExpenses;
  const cashFlow = Math.round((cashInflow - cashOutflow) * 100) / 100;
  const totalSavings = Math.round((totalIncome - totalExpenses) * 100) / 100;
  const savingsRate = totalIncome > 0 ? Math.max(0, (totalSavings / totalIncome) * 100) : 0;
  const netWorth = Math.round((liquidBalance + stockValue + mfValue + fdMaturity + outstandingReceivables) * 100) / 100;
  const remainingDisposableIncome = Math.max(0, totalIncome - totalExpenses - pendingBills);

  // 9. Previous Month Data Comparison
  const prevMonth = m === 1 ? 12 : m - 1;
  const prevYear = m === 1 ? y - 1 : y;
  const { startDate: prevStart, endDate: prevEnd, label: prevLabel } = getMonthDateBounds(prevYear, prevMonth);

  const [prevIncomes, prevExpenses] = await Promise.all([
    Income.find({ userId, date: { $gte: prevStart, $lte: prevEnd } }),
    Expense.find({ userId, date: { $gte: prevStart, $lte: prevEnd } }),
  ]);

  let prevIncomeTotal = 0;
  for (const inc of prevIncomes) prevIncomeTotal += Number(inc.amount || 0);

  let prevExpenseTotal = 0;
  const prevCatTotals = {};
  for (const exp of prevExpenses) {
    if (exp.category === "Savings") continue;
    const amt = Number(exp.amount || 0);
    prevExpenseTotal += amt;
    prevCatTotals[exp.category] = (prevCatTotals[exp.category] || 0) + amt;
  }

  const hasPreviousData = prevIncomes.length > 0 || prevExpenses.length > 0;
  const incomeDiffAmt = Math.round((totalIncome - prevIncomeTotal) * 100) / 100;
  const incomeDiffPct = prevIncomeTotal > 0 ? Math.round(((totalIncome - prevIncomeTotal) / prevIncomeTotal) * 100) : 0;

  const expenseDiffAmt = Math.round((totalExpenses - prevExpenseTotal) * 100) / 100;
  const expenseDiffPct = prevExpenseTotal > 0 ? Math.round(((totalExpenses - prevExpenseTotal) / prevExpenseTotal) * 100) : 0;

  // Category-level changes
  const categoryChanges = [];
  for (const cat of Object.keys(categoryTotals)) {
    const curAmt = categoryTotals[cat];
    const prevAmt = prevCatTotals[cat] || 0;
    const diffAmt = Math.round((curAmt - prevAmt) * 100) / 100;
    const diffPct = prevAmt > 0 ? Math.round((diffAmt / prevAmt) * 100) : (curAmt > 0 ? 100 : 0);
    let note = "Stable";
    if (diffPct > 20) note = "Significant Increase";
    else if (diffPct < -20) note = "Decrease";

    categoryChanges.push({
      category: cat,
      diffAmount: diffAmt,
      diffPct,
      note,
    });
  }

  // 10. Financial Health Score
  const healthScore = calculateFinancialHealthScore({
    totalIncome,
    totalExpenses,
    totalSavings,
    savingsRate,
    needSpend,
    wantSpend,
    liquidBalance,
    fixedCommitments,
    totalInvestments,
    hasActiveSIP: activeSIPAmt > 0,
    outstandingReceivables,
    cashFlow,
  });

  // 11. Recommendations Engine
  const recommendations = generateRecommendations({
    totalIncome,
    totalExpenses,
    savingsRate,
    needSpend,
    wantSpend,
    liquidBalance,
    fixedCommitments,
    pendingBills,
    outstandingReceivables,
    topCategories,
    healthScore: healthScore.score,
    previousMonthComparison: { hasPreviousData, categoryChanges },
    currency,
  });

  // 12. Next Month Roadmap
  const nextMonthActionPlan = [
    `Clear all ${pendingBills > 0 ? `${currency} ${pendingBills.toLocaleString()} in pending bills` : "upcoming obligations"} before day 5 of the cycle.`,
    savingsGoal > 0 ? `Target ${currency} ${savingsGoal.toLocaleString()} in designated savings goal reserve.` : "Allocate at least 20% of net income into liquid emergency savings.",
    "Monitor daily Safe-to-Spend to prevent end-of-month budget deficit.",
    outstandingReceivables > 0 ? `Recover ${currency} ${outstandingReceivables.toLocaleString()} in outstanding peer split debts.` : "Regularly audit recurring subscriptions and discretionary splurges.",
  ];

  // 13. Data Completeness Evaluation
  const missingItems = [];
  if (totalIncome === 0) missingItems.push("No income recorded");
  if (expenses.length === 0) missingItems.push("No expense transactions recorded");
  if (accounts.length === 0) missingItems.push("No accounts connected");

  let completenessScore = 100;
  if (missingItems.length > 0) {
    completenessScore = Math.max(30, 100 - (missingItems.length * 25));
  }

  // 14. Financial Foundation (Self-Reported Milestones)
  const foundationDoc = await FinancialFoundation.findOne({ userId });
  let foundationStatus = {
    emergencyFund: "Unanswered",
    healthInsurance: "Unanswered",
    score: 0,
    completedMilestones: 0,
    totalMilestones: 2,
    lastUpdated: null,
    isSelfReported: true,
  };

  if (foundationDoc) {
    const ef = foundationDoc.milestones?.emergencyFund;
    const hi = foundationDoc.milestones?.healthInsurance;
    foundationStatus.emergencyFund = !ef?.answered ? "Unanswered" : ef?.completed ? "Completed" : "Incomplete";
    foundationStatus.healthInsurance = !hi?.answered ? "Unanswered" : hi?.completed ? "Completed" : "Incomplete";
    let fScore = 0;
    if (ef?.completed) fScore += 50;
    if (hi?.completed) fScore += 50;
    foundationStatus.score = fScore;
    foundationStatus.completedMilestones = (ef?.completed ? 1 : 0) + (hi?.completed ? 1 : 0);
    foundationStatus.lastUpdated = foundationDoc.updatedAt || foundationDoc.createdAt;
  }

  // 15. Compile Report Object
  const reportData = {
    userId,
    year: y,
    month: m,
    reportingPeriod: {
      startDate,
      endDate,
      label,
    },
    currency,
    isProvisional,
    financialSummary: {
      totalIncome,
      totalExpenses,
      cashInflow,
      cashOutflow,
      totalSavings,
      savingsRate,
      totalInvestments,
      fixedCommitments,
      pendingBills,
      outstandingReceivables,
      liquidBalance,
      netWorth,
      netWorthChange: incomeDiffAmt - expenseDiffAmt,
      remainingDisposableIncome,
    },
    healthScore,
    financialFoundation: foundationStatus,
    spendingAnalysis: {
      topCategories,
      largestExpenses: topLargestExpenses,
      needSpend,
      wantSpend,
      needPct: totalExpenses > 0 ? (needSpend / totalExpenses) * 100 : 0,
      wantPct: totalExpenses > 0 ? (wantSpend / totalExpenses) * 100 : 0,
      recurringSpend,
      unusualPatterns: categoryChanges.filter(c => c.diffPct >= 40).map(c => `${c.category} spending surged by ${c.diffPct}%`),
      budgetAlerts: pendingBills > 0 ? [`${currency} ${pendingBills.toLocaleString()} in pending recurring obligations`] : [],
    },
    investmentAnalysis: {
      savingsTarget: savingsGoal,
      actualSavings: Math.max(0, totalSavings),
      targetCompletionPct: savingsGoal > 0 ? Math.min(100, Math.round((Math.max(0, totalSavings) / savingsGoal) * 100)) : 100,
      investmentContributions: activeSIPAmt,
      sipConsistency: activeSIPAmt > 0 ? "Active" : "Inactive",
      portfolioAllocation: {
        liquid: liquidBalance,
        stocks: stockValue,
        mutualFunds: mfValue,
        fixedDeposits: fdMaturity,
      },
      emergencyFundMonths: healthScore.breakdown.emergencyFundCoverage.monthsCovered,
      marketDataTimestamp: new Date(),
      isEstimated: false,
    },
    previousMonthComparison: {
      hasPreviousData,
      previousMonthLabel: prevLabel,
      incomeDiff: { amount: incomeDiffAmt, pct: incomeDiffPct },
      expenseDiff: { amount: expenseDiffAmt, pct: expenseDiffPct },
      savingsDiff: { amount: totalSavings - (prevIncomeTotal - prevExpenseTotal), pct: 0 },
      investmentsDiff: { amount: 0, pct: 0 },
      netWorthDiff: { amount: incomeDiffAmt - expenseDiffAmt, pct: 0 },
      healthScoreDiff: 0,
      categoryChanges,
    },
    recommendations,
    nextMonthActionPlan,
    financialWarnings: pendingBills > 0 ? [`You have ${currency} ${pendingBills.toLocaleString()} in unpaid obligations`] : [],
    dataCompleteness: {
      score: completenessScore,
      isComplete: missingItems.length === 0,
      missingItems,
      notes: missingItems.length === 0 ? "Complete ledger records used." : `Assessment based on partial data: ${missingItems.join(", ")}.`,
    },
    calculationVersion: "1.0.0",
    generatedAt: new Date(),
    isOutdated: false,
  };

  // Upsert in database
  const reportDoc = await MonthlyFinancialReport.findOneAndUpdate(
    { userId, year: y, month: m },
    reportData,
    { new: true, upsert: true }
  );

  return reportDoc;
}

/**
 * Lists available monthly reports history for a user.
 */
async function getMonthlyReportsHistory(userId) {
  return MonthlyFinancialReport.find({ userId })
    .sort({ year: -1, month: -1 })
    .select("year month reportingPeriod isProvisional healthScore financialSummary generatedAt");
}

/**
 * Downloads report as PDF buffer.
 */
async function getReportPDF(userId, year, month) {
  let report = await MonthlyFinancialReport.findOne({ userId, year, month });
  if (!report) {
    report = await generateMonthlyReport(userId, year, month);
  }
  const user = await User.findOne({ userId }).select("email userId displayName");
  return generateMonthlyReportPDF(report, user || { userId });
}

/**
 * Downloads report as CSV string.
 */
async function getReportCSV(userId, year, month) {
  let report = await MonthlyFinancialReport.findOne({ userId, year, month });
  if (!report) {
    report = await generateMonthlyReport(userId, year, month);
  }
  const user = await User.findOne({ userId }).select("email userId displayName");
  return generateMonthlyReportCSV(report, user || { userId });
}

module.exports = {
  generateMonthlyReport,
  getMonthlyReportsHistory,
  getReportPDF,
  getReportCSV,
};
