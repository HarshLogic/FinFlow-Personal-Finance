/**
 * Secure CSV Generator with Formula Injection Protection (CWE-1236)
 * 
 * Sanitizes any cell values starting with =, +, -, @, \t, or \r
 * to prevent spreadsheet software from executing arbitrary code.
 */

function sanitizeCSVCell(value) {
  if (value === null || value === undefined) return '""';
  let str = String(value);

  // Formula injection mitigation: prepend a single quote if the first character is dangerous
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape internal double quotes and wrap in quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

function generateMonthlyReportCSV(report, user = {}) {
  const lines = [];

  const addRow = (cells) => {
    lines.push(cells.map(sanitizeCSVCell).join(","));
  };

  const addBlank = () => lines.push("");

  // Header / Metadata
  addRow(["FINFLOW — MONTHLY PERSONAL CA FINANCIAL REPORT"]);
  addRow(["Reporting Period", report.reportingPeriod?.label || `${report.month}/${report.year}`]);
  addRow(["User", user.email || user.userId || "User"]);
  addRow(["Generated Date", new Date(report.generatedAt || Date.now()).toISOString().split("T")[0]]);
  addRow(["Currency", report.currency || "INR"]);
  addRow(["Provisional Status", report.isProvisional ? "YES (Month In Progress)" : "NO (Finalized)"]);
  addBlank();

  // Financial Health Score
  addRow(["=== FINANCIAL HEALTH SCORE ==="]);
  addRow(["Total Score", report.healthScore?.score || 0, "Out of 100"]);
  addRow(["Classification", report.healthScore?.rating || "N/A"]);
  addBlank();

  // Health Breakdown
  addRow(["Health Factor", "Score", "Max Points", "Reason / Notes"]);
  const b = report.healthScore?.breakdown || {};
  addRow(["Savings Performance", b.savingsPerformance?.score || 0, 25, b.savingsPerformance?.reason || ""]);
  addRow(["Budget Discipline", b.budgetDiscipline?.score || 0, 20, b.budgetDiscipline?.reason || ""]);
  addRow(["Emergency Fund Coverage", b.emergencyFundCoverage?.score || 0, 20, b.emergencyFundCoverage?.reason || ""]);
  addRow(["Debt & Fixed Obligations", b.debtAndObligations?.score || 0, 15, b.debtAndObligations?.reason || ""]);
  addRow(["Investment Consistency", b.investmentConsistency?.score || 0, 10, b.investmentConsistency?.reason || ""]);
  addRow(["Cash Flow Stability", b.cashFlowStability?.score || 0, 10, b.cashFlowStability?.reason || ""]);
  addBlank();

  // Financial Foundation (Self-Reported)
  if (report.financialFoundation) {
    const ff = report.financialFoundation;
    addRow(["=== FINANCIAL FOUNDATION MILESTONES (SELF-REPORTED) ==="]);
    addRow(["Milestone", "Status", "Points"]);
    addRow(["Emergency Fund (3-6 Months)", ff.emergencyFund || "Unanswered", ff.emergencyFund === "Completed" ? 50 : 0]);
    addRow(["Health Insurance", ff.healthInsurance || "Unanswered", ff.healthInsurance === "Completed" ? 50 : 0]);
    addRow(["Financial Foundation Score", ff.score || 0, "Out of 100"]);
    addRow(["Note", "Self-reported checklist. Distinct from algorithmic Financial Health Score."]);
    addBlank();
  }

  // Financial Summary
  addRow(["=== MONTHLY FINANCIAL LEDGER SUMMARY ==="]);
  addRow(["Metric", "Amount"]);
  const s = report.financialSummary || {};
  addRow(["Total Income", s.totalIncome || 0]);
  addRow(["Total Personal Expenses", s.totalExpenses || 0]);
  addRow(["Essential Spend (Needs)", report.spendingAnalysis?.needSpend || 0]);
  addRow(["Discretionary Spend (Wants)", report.spendingAnalysis?.wantSpend || 0]);
  addRow(["Total Savings", s.totalSavings || 0]);
  addRow(["Savings Rate (%)", (s.savingsRate || 0).toFixed(2)]);
  addRow(["Liquid Cash Reserves", s.liquidBalance || 0]);
  addRow(["Total Fixed Obligations", s.fixedCommitments || 0]);
  addRow(["Pending Bills Due", s.pendingBills || 0]);
  addRow(["Outstanding Receivables (Peer Debt)", s.outstandingReceivables || 0]);
  addRow(["Estimated Net Worth", s.netWorth || 0]);
  addRow(["Net Worth MoM Change", s.netWorthChange || 0]);
  addBlank();

  // Top Spending Categories
  addRow(["=== TOP SPENDING CATEGORIES ==="]);
  addRow(["Category", "Amount", "Percentage of Total"]);
  (report.spendingAnalysis?.topCategories || []).forEach(cat => {
    addRow([cat.category, cat.amount, `${(cat.percentage || 0).toFixed(1)}%`]);
  });
  addBlank();

  // Personalized Recommendations
  addRow(["=== PERSONALIZED CA RECOMMENDATIONS ==="]);
  addRow(["Priority", "Recommendation", "Reason", "Action", "Estimated Financial Impact"]);
  (report.recommendations || []).forEach(rec => {
    addRow([
      rec.priority,
      rec.title,
      rec.reason,
      rec.suggestedAction,
      rec.estimatedImpact || "N/A",
    ]);
  });
  addBlank();

  // Action Plan
  addRow(["=== NEXT MONTH ROADMAP ==="]);
  (report.nextMonthActionPlan || []).forEach((step, idx) => {
    addRow([`Step ${idx + 1}`, step]);
  });
  addBlank();

  // Disclaimer
  addRow(["DISCLAIMER", "This automated financial review is for informational budgeting purposes only and does not replace a licensed Chartered Accountant or formal tax consultation."]);

  return lines.join("\r\n");
}

module.exports = {
  sanitizeCSVCell,
  generateMonthlyReportCSV,
};
