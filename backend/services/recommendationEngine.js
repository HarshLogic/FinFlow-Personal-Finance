/**
 * FinFlow Rule-Based Personalized Recommendation Engine
 * 
 * Generates transparent, actionable, prioritized financial recommendations
 * based on actual user activity and financial status.
 */

function generateRecommendations({
  totalIncome = 0,
  totalExpenses = 0,
  savingsRate = 0,
  needSpend = 0,
  wantSpend = 0,
  liquidBalance = 0,
  fixedCommitments = 0,
  pendingBills = 0,
  outstandingReceivables = 0,
  topCategories = [],
  healthScore = 0,
  previousMonthComparison = null,
  currency = "INR",
}) {
  const recommendations = [];
  const currencySymbol = currency === "USD" ? "$" : currency === "GBP" ? "£" : "₹";
  const fmt = (num) => `${currencySymbol}${Math.round(num).toLocaleString()}`;

  // 1. High Discretionary / "Want" Spending Rule
  const totalSpend = needSpend + wantSpend || totalExpenses;
  if (totalSpend > 0 && (wantSpend / totalSpend) > 0.35) {
    const wantPct = Math.round((wantSpend / totalSpend) * 100);
    const excessWant = Math.round(wantSpend - (totalSpend * 0.30));
    recommendations.push({
      id: "REC_DISCRETIONARY_SPEND",
      title: "Trim Discretionary Lifestyle Spending",
      reason: `Your discretionary (Want) expenses accounted for ${wantPct}% of your total spending, surpassing the 30% healthy benchmark.`,
      supportingData: `Total Discretionary Spend: ${fmt(wantSpend)} | Excess above 30%: ${fmt(excessWant)}`,
      suggestedAction: "Audit discretionary categories like Dining, Shopping, or OTT, and cap weekend lifestyle splurges.",
      estimatedImpact: `Saves up to ${fmt(excessWant)} per month, directly increasing your savings rate.`,
      priority: wantPct > 50 ? "HIGH" : "MEDIUM",
    });
  }

  // 2. Emergency Fund Depleted or Below 3 Months
  const monthlyEssential = Math.max(1000, needSpend || (totalExpenses * 0.6) || 10000);
  const emergencyMonths = liquidBalance / monthlyEssential;
  if (emergencyMonths < 1.0) {
    const shortfallTo3Mo = Math.max(0, (monthlyEssential * 3) - liquidBalance);
    recommendations.push({
      id: "REC_EMERGENCY_FUND_CRITICAL",
      title: "Build Emergency Cash Buffer Immediately",
      reason: `Your liquid reserves (${fmt(liquidBalance)}) cover less than 1 month of essential expenses. A single unexpected expense could force high-interest borrowing.`,
      supportingData: `Current Runway: ${emergencyMonths.toFixed(1)} months | Target: 3 to 6 months (${fmt(monthlyEssential * 3)})`,
      suggestedAction: "Direct at least 50% of any surplus cash into a liquid savings account until reaching a 3-month safety cushion.",
      estimatedImpact: `Protects against sudden income shocks and avoids taking high-interest personal loans.`,
      priority: "HIGH",
    });
  } else if (emergencyMonths < 3.0) {
    recommendations.push({
      id: "REC_EMERGENCY_FUND_MODERATE",
      title: "Strengthen Emergency Safety Runway",
      reason: `You currently have ${emergencyMonths.toFixed(1)} months of emergency runway. Financial planners recommend at least 3 to 6 months.`,
      supportingData: `Current Liquid Reserves: ${fmt(liquidBalance)} | 3-Month Target: ${fmt(monthlyEssential * 3)}`,
      suggestedAction: "Allocate a small recurring monthly portion into a high-interest savings account or auto-sweep FD.",
      estimatedImpact: `Adds peace of mind and financial resilience against unexpected medical or repair bills.`,
      priority: "MEDIUM",
    });
  }

  // 3. Pending Unpaid Fixed Obligations Alert
  if (pendingBills > 0) {
    recommendations.push({
      id: "REC_PENDING_BILLS",
      title: "Settle Upcoming Fixed Obligations",
      reason: `You have ${fmt(pendingBills)} in unpaid fixed obligations and recurring bills scheduled for this cycle.`,
      supportingData: `Pending Bills: ${fmt(pendingBills)}`,
      suggestedAction: "Ensure your primary checking account has sufficient balance to prevent missed auto-debit charges or late penalties.",
      estimatedImpact: `Avoids late payment penalties (typically ₹250–₹750 per instance) and protects your credit score.`,
      priority: "HIGH",
    });
  }

  // 4. Heavy Fixed Commitments Burden
  if (totalIncome > 0 && (fixedCommitments / totalIncome) > 0.50) {
    const fixedPct = Math.round((fixedCommitments / totalIncome) * 100);
    recommendations.push({
      id: "REC_HIGH_FIXED_DEBT",
      title: "Optimize Fixed Commitments & Subscriptions",
      reason: `Fixed recurring obligations consume ${fixedPct}% of your monthly income, leaving limited room for savings or unexpected expenses.`,
      supportingData: `Total Fixed Obligations: ${fmt(fixedCommitments)} (${fixedPct}% of Income)`,
      suggestedAction: "Audit recurring subscriptions, gym memberships, and high-interest EMIs. Consider consolidating debt or canceling unused services.",
      estimatedImpact: `Lowers monthly baseline burn rate and frees up discretionary cash flow.`,
      priority: "HIGH",
    });
  }

  // 5. Significant Outstanding Peer Debt / Receivables
  if (outstandingReceivables > 2000) {
    recommendations.push({
      id: "REC_RECOVER_PEER_DEBT",
      title: "Follow Up on Outstanding Receivables",
      reason: `Friends or colleagues owe you ${fmt(outstandingReceivables)} in split expenses that remain unsettled.`,
      supportingData: `Total Unsettled Receivables: ${fmt(outstandingReceivables)}`,
      suggestedAction: "Send a polite UPI reminder via WhatsApp or PhonePe to recover borrowed amounts before month-end.",
      estimatedImpact: `Instantly injects ${fmt(outstandingReceivables)} back into your liquid cash balance.`,
      priority: "MEDIUM",
    });
  }

  // 6. Food Delivery & Dining Spike Rule
  const foodCategory = topCategories.find(c => c.category.toLowerCase().includes("food") || c.category.toLowerCase().includes("dining"));
  if (foodCategory && totalSpend > 0 && (foodCategory.amount / totalSpend) > 0.25) {
    const foodPct = Math.round((foodCategory.amount / totalSpend) * 100);
    const potentialSaving = Math.round(foodCategory.amount * 0.20);
    recommendations.push({
      id: "REC_FOOD_DINING_OPT",
      title: "Reduce Online Food Ordering & Dining Out",
      reason: `Food & Dining represents ${foodPct}% of your total expenditure (${fmt(foodCategory.amount)}).`,
      supportingData: `Food Spend: ${fmt(foodCategory.amount)} (${foodPct}% of budget)`,
      suggestedAction: "Try meal planning or limit app deliveries (Swiggy/Zomato) to 2 days per week.",
      estimatedImpact: `Potential monthly savings of approx. ${fmt(potentialSaving)}.`,
      priority: "MEDIUM",
    });
  }

  // 7. Previous Month Comparison: Surging Spending in a Category
  if (previousMonthComparison && previousMonthComparison.categoryChanges) {
    const surgingCategory = previousMonthComparison.categoryChanges.find(c => c.diffPct >= 30 && c.diffAmount >= 1500);
    if (surgingCategory) {
      recommendations.push({
        id: `REC_SURGE_${surgingCategory.category.toUpperCase()}`,
        title: `Spending Spike in ${surgingCategory.category}`,
        reason: `Your spending in ${surgingCategory.category} increased by ${surgingCategory.diffPct}% (+${fmt(surgingCategory.diffAmount)}) compared with last month.`,
        supportingData: `Increase: +${fmt(surgingCategory.diffAmount)} (${surgingCategory.diffPct}% increase)`,
        suggestedAction: `Review transactions in ${surgingCategory.category} to determine if this was a one-off necessary expense or recurring creep.`,
        estimatedImpact: `Helps prevent lifestyle inflation from resetting your monthly budget baseline.`,
        priority: "MEDIUM",
      });
    }
  }

  // 8. Positive Savings Habit Reinforcement
  if (savingsRate >= 20 && recommendations.length < 5) {
    recommendations.push({
      id: "REC_INVEST_SURPLUS",
      title: "Channel Surplus Savings into Growth Assets",
      reason: `You maintained a healthy savings rate of ${savingsRate.toFixed(1)}% this month.`,
      supportingData: `Current Savings Rate: ${savingsRate.toFixed(1)}%`,
      suggestedAction: "Consider channeling your unallocated surplus into index funds or systematic SIPs to beat inflation.",
      estimatedImpact: "Compounding at 12% p.a. can double your wealth every ~6 years.",
      priority: "LOW",
    });
  }

  // Fallback if no specific triggers fired
  if (recommendations.length === 0) {
    recommendations.push({
      id: "REC_MAINTAIN_DISCIPLINE",
      title: "Maintain Budget Discipline & Review Monthly Goals",
      reason: "Your financial indicators are currently stable with no immediate danger flags.",
      supportingData: `Health Score: ${healthScore}/100 | Savings Rate: ${savingsRate.toFixed(1)}%`,
      suggestedAction: "Review next month's planned purchases and ensure all recurring bills remain set on auto-pay.",
      estimatedImpact: "Sustained long-term wealth compounding and peace of mind.",
      priority: "LOW",
    });
  }

  return recommendations;
}

module.exports = {
  generateRecommendations,
};
