/**
 * FinFlow Financial Health Score Service
 * 
 * Configurable 6-factor scoring model (0 - 100):
 * 1. Savings performance       (max 25 pts)
 * 2. Budget discipline         (max 20 pts)
 * 3. Emergency fund coverage   (max 20 pts)
 * 4. Debt & fixed obligations  (max 15 pts)
 * 5. Investment consistency    (max 10 pts)
 * 6. Cash flow stability       (max 10 pts)
 * Total: 100 pts
 */

function calculateFinancialHealthScore({
  totalIncome = 0,
  totalExpenses = 0,
  totalSavings = 0,
  savingsRate = 0,
  needSpend = 0,
  wantSpend = 0,
  liquidBalance = 0,
  fixedCommitments = 0,
  totalInvestments = 0,
  hasActiveSIP = false,
  outstandingReceivables = 0,
  cashFlow = 0,
}) {
  const breakdown = {
    savingsPerformance: { score: 0, max: 25, reason: "" },
    budgetDiscipline: { score: 0, max: 20, reason: "" },
    emergencyFundCoverage: { score: 0, max: 20, reason: "", monthsCovered: 0 },
    debtAndObligations: { score: 0, max: 15, reason: "", ratioPct: 0 },
    investmentConsistency: { score: 0, max: 10, reason: "" },
    cashFlowStability: { score: 0, max: 10, reason: "" },
  };

  // 1. Savings Performance (max 25)
  // Benchmark: >= 20% savings rate is golden standard (50-30-20 rule)
  if (totalIncome <= 0) {
    breakdown.savingsPerformance.score = 5;
    breakdown.savingsPerformance.reason = "No recorded income this month to evaluate savings performance.";
  } else if (savingsRate >= 30) {
    breakdown.savingsPerformance.score = 25;
    breakdown.savingsPerformance.reason = `Outstanding savings rate of ${savingsRate.toFixed(1)}%, exceeding the 20% benchmark.`;
  } else if (savingsRate >= 20) {
    breakdown.savingsPerformance.score = 22;
    breakdown.savingsPerformance.reason = `Strong savings rate of ${savingsRate.toFixed(1)}%, aligned with recommended 50-30-20 rule.`;
  } else if (savingsRate >= 10) {
    breakdown.savingsPerformance.score = 15;
    breakdown.savingsPerformance.reason = `Moderate savings rate of ${savingsRate.toFixed(1)}%. Aim for 20% to build wealth faster.`;
  } else if (savingsRate > 0) {
    breakdown.savingsPerformance.score = 8;
    breakdown.savingsPerformance.reason = `Low savings rate of ${savingsRate.toFixed(1)}%. Consider trimming discretionary spending.`;
  } else {
    breakdown.savingsPerformance.score = 2;
    breakdown.savingsPerformance.reason = "Zero or negative net savings recorded this month.";
  }

  // 2. Budget Discipline (max 20)
  // Evaluates Need vs Want balance and living within means
  const totalSpend = needSpend + wantSpend || totalExpenses;
  if (totalSpend === 0) {
    breakdown.budgetDiscipline.score = 15;
    breakdown.budgetDiscipline.reason = "No expense data recorded for this month.";
  } else {
    const wantRatio = (wantSpend / totalSpend) * 100;
    const expenseToIncomeRatio = totalIncome > 0 ? (totalSpend / totalIncome) * 100 : 100;

    let points = 20;
    const notes = [];

    // Want ratio penalty (should ideally be <= 30%)
    if (wantRatio > 50) {
      points -= 8;
      notes.push(`Discretionary (Want) spending was high at ${wantRatio.toFixed(0)}% of total expenses`);
    } else if (wantRatio > 35) {
      points -= 4;
      notes.push(`Discretionary spending was slightly elevated at ${wantRatio.toFixed(0)}%`);
    }

    // Overspending penalty
    if (totalIncome > 0 && expenseToIncomeRatio > 100) {
      points -= 8;
      notes.push(`Expenses exceeded income by ${(expenseToIncomeRatio - 100).toFixed(0)}%`);
    } else if (totalIncome > 0 && expenseToIncomeRatio > 85) {
      points -= 3;
      notes.push(`Expenses consumed ${expenseToIncomeRatio.toFixed(0)}% of income`);
    }

    breakdown.budgetDiscipline.score = Math.max(2, points);
    breakdown.budgetDiscipline.reason = notes.length > 0 
      ? notes.join(". ") + "." 
      : "Excellent budget discipline. Discretionary spending was strictly controlled.";
  }

  // 3. Emergency Fund Coverage (max 20)
  // Benchmark: 3 to 6 months of essential spending in liquid cash
  const monthlyEssentialSpend = Math.max(1000, needSpend || (totalExpenses * 0.6) || 10000);
  const monthsCovered = Math.round((liquidBalance / monthlyEssentialSpend) * 10) / 10;
  breakdown.emergencyFundCoverage.monthsCovered = monthsCovered;

  if (monthsCovered >= 6) {
    breakdown.emergencyFundCoverage.score = 20;
    breakdown.emergencyFundCoverage.reason = `Robust emergency safety net with ${monthsCovered} months of essential expenses in liquid reserves.`;
  } else if (monthsCovered >= 3) {
    breakdown.emergencyFundCoverage.score = 16;
    breakdown.emergencyFundCoverage.reason = `Healthy emergency fund covering ${monthsCovered} months of living expenses.`;
  } else if (monthsCovered >= 1) {
    breakdown.emergencyFundCoverage.score = 10;
    breakdown.emergencyFundCoverage.reason = `Basic reserve covering ${monthsCovered} month(s). Recommended target is 3 to 6 months.`;
  } else if (liquidBalance > 0) {
    breakdown.emergencyFundCoverage.score = 5;
    breakdown.emergencyFundCoverage.reason = `Emergency fund covers less than 1 month (${monthsCovered} mos). Priority should be building a liquid buffer.`;
  } else {
    breakdown.emergencyFundCoverage.score = 0;
    breakdown.emergencyFundCoverage.reason = "No liquid emergency cash buffer detected.";
  }

  // 4. Debt & Fixed Obligations (max 15)
  // Ratio of fixed commitments to monthly income (< 40% is healthy, > 60% is risky)
  const debtRatio = totalIncome > 0 ? (fixedCommitments / totalIncome) * 100 : (fixedCommitments > 0 ? 100 : 0);
  breakdown.debtAndObligations.ratioPct = Math.round(debtRatio);

  if (fixedCommitments === 0) {
    breakdown.debtAndObligations.score = 15;
    breakdown.debtAndObligations.reason = "Zero recurring debt obligations or fixed bills due.";
  } else if (debtRatio <= 30) {
    breakdown.debtAndObligations.score = 15;
    breakdown.debtAndObligations.reason = `Fixed obligations are very manageable at ${debtRatio.toFixed(1)}% of income.`;
  } else if (debtRatio <= 45) {
    breakdown.debtAndObligations.score = 12;
    breakdown.debtAndObligations.reason = `Fixed obligations consume ${debtRatio.toFixed(1)}% of income, within safe operating range.`;
  } else if (debtRatio <= 60) {
    breakdown.debtAndObligations.score = 8;
    breakdown.debtAndObligations.reason = `Fixed obligations are moderately high (${debtRatio.toFixed(1)}% of income). Avoid taking on new debt.`;
  } else {
    breakdown.debtAndObligations.score = 3;
    breakdown.debtAndObligations.reason = `Heavy fixed burden: ${debtRatio.toFixed(1)}% of income committed to fixed bills and obligations.`;
  }

  // 5. Investment Consistency (max 10)
  // Evaluates systematic wealth creation (SIPs, stocks, mutual funds, FDs)
  if (totalInvestments > 0 || hasActiveSIP) {
    if (totalInvestments >= 10000 || (totalIncome > 0 && (totalInvestments / totalIncome) >= 0.15)) {
      breakdown.investmentConsistency.score = 10;
      breakdown.investmentConsistency.reason = "Strong investment activity with substantial contributions to long-term wealth assets.";
    } else {
      breakdown.investmentConsistency.score = 7;
      breakdown.investmentConsistency.reason = "Consistent investment contributions recorded this cycle.";
    }
  } else {
    breakdown.investmentConsistency.score = 2;
    breakdown.investmentConsistency.reason = "No investment contributions or active SIPs detected this month.";
  }

  // 6. Cash Flow Stability (max 10)
  // Net cash flow (Inflow vs Outflow)
  if (cashFlow > 0) {
    if (totalIncome > 0 && (cashFlow / totalIncome) >= 0.15) {
      breakdown.cashFlowStability.score = 10;
      breakdown.cashFlowStability.reason = "Very strong positive net cash flow with healthy surplus.";
    } else {
      breakdown.cashFlowStability.score = 8;
      breakdown.cashFlowStability.reason = "Positive net cash flow maintained throughout the month.";
    }
  } else if (cashFlow === 0) {
    breakdown.cashFlowStability.score = 5;
    breakdown.cashFlowStability.reason = "Cash flow balanced at breakeven.";
  } else {
    breakdown.cashFlowStability.score = 1;
    breakdown.cashFlowStability.reason = "Negative cash flow: outflows exceeded total cash inflows.";
  }

  // Calculate Total Score
  const totalScore = Math.min(
    100,
    Math.max(
      0,
      breakdown.savingsPerformance.score +
      breakdown.budgetDiscipline.score +
      breakdown.emergencyFundCoverage.score +
      breakdown.debtAndObligations.score +
      breakdown.investmentConsistency.score +
      breakdown.cashFlowStability.score
    )
  );

  // Classification
  let rating = "Needs Improvement";
  let color = "#F59E0B";

  if (totalScore >= 90) {
    rating = "Excellent";
    color = "#10B981"; // Emerald
  } else if (totalScore >= 75) {
    rating = "Healthy";
    color = "#3B82F6"; // Blue
  } else if (totalScore >= 60) {
    rating = "Needs Improvement";
    color = "#F59E0B"; // Amber
  } else if (totalScore >= 40) {
    rating = "Financially Vulnerable";
    color = "#F97316"; // Orange
  } else {
    rating = "High Financial Risk";
    color = "#EF4444"; // Red
  }

  return {
    score: totalScore,
    rating,
    color,
    breakdown,
  };
}

module.exports = {
  calculateFinancialHealthScore,
};
