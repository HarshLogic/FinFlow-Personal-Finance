const { calculateEMI } = require("./emiCalculator");
const {
  PurchaseSimulation,
  SavingsGoal,
  Account,
  Expense,
  Income,
  RecurringObligation,
  BudgetCycle,
  Liquid,
  FinancialFoundation,
  toDecimal128,
  decimalToNumber,
} = require("../models");

/**
 * Rounds a number to 2 decimal places.
 */
function round2(num) {
  if (typeof num !== "number" || isNaN(num) || !isFinite(num)) return 0;
  return Math.round(num * 100) / 100;
}

/**
 * Formats a currency number for text explanations.
 */
function fmtAmt(amt, curr = "INR") {
  const symbol = curr === "INR" ? "₹" : curr + " ";
  return `${symbol}${Number(amt || 0).toLocaleString("en-IN")}`;
}

/**
 * Retrieves user's live financial profile from FinFlow database.
 * Aggregates live values with complete source provenance.
 */
async function getUserFinancialProfile(userId) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // 1. Monthly Take-Home Income (last 30 days or recurring budget fallback)
  const recentIncomes = await Income.find({ userId, date: { $gte: thirtyDaysAgo } });
  let monthlyIncome = recentIncomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
  let incomeSource = "Transactions (last 30 days)";

  if (monthlyIncome === 0) {
    const allIncomes = await Income.find({ userId }).sort({ date: -1 }).limit(10);
    if (allIncomes.length > 0) {
      monthlyIncome = allIncomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
      incomeSource = "Historical Income Records";
    }
  }

  // 2. Monthly Essential Expenses (excluding EMIs & fixed obligations)
  const recentNeeds = await Expense.find({
    userId,
    type: "need",
    date: { $gte: thirtyDaysAgo },
    obligationId: { $exists: false },
  });
  let essentialExpenses = recentNeeds.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  let expenseSource = "Need-category Expenses (last 30 days)";

  if (essentialExpenses === 0) {
    const allNeeds = await Expense.find({ userId, type: "need", obligationId: { $exists: false } }).limit(20);
    essentialExpenses = allNeeds.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    if (essentialExpenses > 0) expenseSource = "Historical Need Expenses";
  }

  // 3. Existing Monthly EMIs & Other Unpaid Commitments
  const activeObligations = await RecurringObligation.find({ userId, isActive: true });
  let existingEMIs = 0;
  let otherUnpaidCommitments = 0;

  for (const obl of activeObligations) {
    const amt = decimalToNumber(obl.amount);
    const cat = (obl.category || "").toLowerCase();
    const title = (obl.title || "").toLowerCase();
    const type = (obl.type || "").toLowerCase();

    if (
      cat.includes("loan") ||
      cat.includes("emi") ||
      cat.includes("mortgage") ||
      title.includes("loan") ||
      title.includes("emi") ||
      type.includes("loan")
    ) {
      existingEMIs += amt;
    } else {
      otherUnpaidCommitments += amt;
    }
  }

  // 4. Monthly Planned Savings & Investments
  const activeGoals = await SavingsGoal.find({ userId, status: "ACTIVE" });
  let plannedSavings = activeGoals.reduce((sum, g) => sum + decimalToNumber(g.monthlyContribution), 0);
  let savingsSource = "Active Savings Goals";

  const budgetCycle = await BudgetCycle.findOne({ userId });
  if (plannedSavings === 0 && budgetCycle?.monthlySavingsGoal) {
    plannedSavings = decimalToNumber(budgetCycle.monthlySavingsGoal);
    savingsSource = "Budget Cycle Target";
  }

  // 5. Available Liquid Bank Balance (only liquid checking/savings/cash, excluding locked investments)
  const userAccounts = await Account.find({ userId, isActive: true });
  let liquidBalance = 0;
  let accountCount = 0;

  for (const acc of userAccounts) {
    if (acc.isLiquid) {
      liquidBalance += decimalToNumber(acc.currentBalance);
      accountCount++;
    }
  }

  if (liquidBalance === 0) {
    const liquidDoc = await Liquid.findOne({ userId });
    if (liquidDoc && liquidDoc.balance > 0) {
      liquidBalance = Number(liquidDoc.balance) || 0;
    }
  }

  // 6. Emergency Fund Target Months (default 6, or from user preference)
  let emergencyFundMonths = 6;
  const foundation = await FinancialFoundation.findOne({ userId });
  if (foundation?.emergencyFundMonths) {
    emergencyFundMonths = foundation.emergencyFundMonths;
  }

  const currency = budgetCycle?.currency || "INR";

  return {
    monthlyIncome: round2(monthlyIncome),
    essentialExpenses: round2(essentialExpenses),
    existingEMIs: round2(existingEMIs),
    plannedSavings: round2(plannedSavings),
    liquidBalance: round2(liquidBalance),
    otherUnpaidCommitments: round2(otherUnpaidCommitments),
    emergencyFundMonths,
    currency,
    provenance: {
      incomeSource,
      expenseSource,
      savingsSource,
      liquidAccountsCount: accountCount,
      reportingPeriod: "Last 30 Days Live Sync",
    },
  };
}

/**
 * Calculates Full Payment Affordability using deterministic mathematical formulas.
 */
function calculateFullPaymentAffordability(params) {
  const {
    productName = "Planned Purchase",
    amount = 0,
    monthlyIncome = 0,
    essentialExpenses = 0,
    existingEMIs = 0,
    plannedSavings = 0,
    liquidBalance = 0,
    otherUnpaidCommitments = 0,
    emergencyFundMonths = 6,
    currency = "INR",
  } = params;

  const P = Math.max(0, Number(amount) || 0);
  const I = Math.max(0, Number(monthlyIncome) || 0);
  const E = Math.max(0, Number(essentialExpenses) || 0);
  const D = Math.max(0, Number(existingEMIs) || 0);
  const S = Math.max(0, Number(plannedSavings) || 0);
  const B = Math.max(0, Number(liquidBalance) || 0);
  const C = Math.max(0, Number(otherUnpaidCommitments) || 0);
  const M = emergencyFundMonths === 3 ? 3 : 6;

  // 1. Disposable Income: I_disposable = I - E - D - S (unclamped to show deficits)
  const monthlyDisposableIncome = round2(I - E - D - S);

  // 2. Required Emergency Fund: F_emergency = (E + D) * M
  const requiredEmergencyFund = round2((E + D) * M);

  // 3. Raw & Available Spending Balance:
  // rawSpendingBalance = B - F_emergency - C
  const rawSpendingBalance = round2(B - requiredEmergencyFund - C);
  const availableSpendingBalance = Math.max(0, rawSpendingBalance);

  // 4. Emergency Fund Shortfall
  const emergencyFundShortfall = Math.max(0, round2(requiredEmergencyFund - B));

  // 5. Affordability Ratio: (P / availableSpendingBalance) * 100
  let affordabilityRatio = 0;
  if (availableSpendingBalance > 0) {
    affordabilityRatio = round2((P / availableSpendingBalance) * 100);
  } else if (P > 0) {
    affordabilityRatio = 100;
  }

  // 6. Status Determination
  let status = "NOT_AFFORDABLE";
  if (P <= 0) {
    status = "INSUFFICIENT_DATA";
  } else if (availableSpendingBalance <= 0 || P > availableSpendingBalance) {
    status = "NOT_AFFORDABLE";
  } else if (affordabilityRatio <= 25) {
    status = monthlyDisposableIncome < 0 ? "RISKY" : "COMFORTABLY_AFFORDABLE";
  } else if (affordabilityRatio <= 50) {
    status = monthlyDisposableIncome < 0 ? "RISKY" : "AFFORDABLE";
  } else {
    status = "RISKY";
  }

  // 7. Post-Purchase Projections
  const postPurchaseBankBalance = round2(B - P);
  const postPurchaseUnreservedBalance = Math.max(0, round2(rawSpendingBalance - P));
  const postPurchaseMonthlyDisposableIncome = monthlyDisposableIncome;
  const postPurchaseMonthlyEMIs = D;

  // 8. Savings Timeline & Funding Gap
  const totalFundingGap = Math.max(0, round2(P - rawSpendingBalance));
  const requiredAdditionalSavings = totalFundingGap;
  let monthsRequired = 0;

  if (totalFundingGap > 0) {
    if (monthlyDisposableIncome > 0) {
      monthsRequired = Math.ceil(totalFundingGap / monthlyDisposableIncome);
    } else {
      monthsRequired = null; // Cannot reach target with zero or negative disposable income
    }
  }

  // 9. Generate Deterministic Explanations & Reasons
  const reasons = [];
  reasons.push(
    `Purchase price of ${fmtAmt(P, currency)} represents ${affordabilityRatio}% of your unreserved spending balance (${fmtAmt(availableSpendingBalance, currency)}).`
  );
  reasons.push(
    `Your ${M}-month emergency fund target of ${fmtAmt(requiredEmergencyFund, currency)} is based on essential needs (${fmtAmt(E, currency)}) and debt (${fmtAmt(D, currency)}).`
  );

  if (emergencyFundShortfall > 0) {
    reasons.push(
      `Warning: You have an existing emergency fund deficit of ${fmtAmt(emergencyFundShortfall, currency)}.`
    );
  }

  if (monthlyDisposableIncome < 0) {
    reasons.push(
      `Caution: Your monthly cash flow has a deficit of ${fmtAmt(Math.abs(monthlyDisposableIncome), currency)}/month.`
    );
  } else {
    reasons.push(
      `Monthly disposable income is ${fmtAmt(monthlyDisposableIncome, currency)} after essentials, debt obligations, and planned savings.`
    );
  }

  if (C > 0) {
    reasons.push(`Other unpaid commitments of ${fmtAmt(C, currency)} are protected from spending.`);
  }

  let recommendation = "";
  if (status === "COMFORTABLY_AFFORDABLE") {
    recommendation = `This purchase is comfortably affordable with zero debt. Your ${M}-month emergency fund (${fmtAmt(requiredEmergencyFund, currency)}) and bills remain 100% intact, leaving ${fmtAmt(postPurchaseUnreservedBalance, currency)} in discretionary reserves.`;
  } else if (status === "AFFORDABLE") {
    recommendation = `You can afford this purchase without compromising your emergency fund. It will consume ${affordabilityRatio}% of your unreserved balance, leaving ${fmtAmt(postPurchaseUnreservedBalance, currency)} in uncommitted cash.`;
  } else if (status === "RISKY") {
    if (monthlyDisposableIncome < 0) {
      recommendation = `Risky: Although you have liquid cash, your monthly cash flow is running at a deficit of ${fmtAmt(Math.abs(monthlyDisposableIncome), currency)}. Prioritize balancing monthly income and expenses first.`;
    } else {
      recommendation = `Risky: This purchase takes more than half (${affordabilityRatio}%) of your available unreserved balance. Any unforeseen expense could cut into your emergency reserve.`;
    }
  } else {
    if (monthsRequired !== null && monthsRequired > 0) {
      recommendation = `Not affordable right now: You have a funding gap of ${fmtAmt(totalFundingGap, currency)}. At your current disposable income of ${fmtAmt(monthlyDisposableIncome, currency)}/mo, you can comfortably buy this in ${monthsRequired} month(s) without debt stress.`;
    } else {
      recommendation = `Not affordable right now: You have a funding gap of ${fmtAmt(totalFundingGap, currency)} and no monthly surplus. Increase monthly income or reduce discretionary spending before making this purchase.`;
    }
  }

  return {
    paymentMethod: "FULL_PAYMENT",
    productName,
    amount: P,
    monthlyIncome: I,
    essentialExpenses: E,
    existingEMIs: D,
    plannedSavings: S,
    liquidBalance: B,
    otherUnpaidCommitments: C,
    emergencyFundMonths: M,
    currency,
    status,
    monthlyDisposableIncome,
    requiredEmergencyFund,
    availableSpendingBalance,
    emergencyFundShortfall,
    affordabilityRatio,
    emiAffordabilityRatio: 0,
    debtToIncomeRatio: I > 0 ? round2((D / I) * 100) : 0,
    postPurchaseBankBalance,
    postPurchaseUnreservedBalance,
    postPurchaseMonthlyDisposableIncome,
    postPurchaseMonthlyEMIs,
    requiredAdditionalSavings,
    totalFundingGap,
    monthsRequired,
    recommendation,
    reasons,
    emiDetails: {
      downPayment: 0,
      tenureMonths: 0,
      annualInterestRate: 0,
      processingFee: 0,
      otherUpfrontCharges: 0,
      monthlyEMI: 0,
      totalInterest: 0,
      totalCost: P,
    },
  };
}

/**
 * Calculates EMI Payment Affordability using deterministic reducing-balance formulas.
 */
function calculateEmiAffordability(params) {
  const {
    productName = "Planned Purchase",
    amount = 0,
    monthlyIncome = 0,
    essentialExpenses = 0,
    existingEMIs = 0,
    plannedSavings = 0,
    liquidBalance = 0,
    otherUnpaidCommitments = 0,
    emergencyFundMonths = 6,
    downPayment = 0,
    annualInterestRate = 0,
    tenureMonths = 12,
    processingFees = 0,
    otherUpfrontCharges = 0,
    currency = "INR",
  } = params;

  const P = Math.max(0, Number(amount) || 0);
  const I = Math.max(0, Number(monthlyIncome) || 0);
  const E = Math.max(0, Number(essentialExpenses) || 0);
  const D = Math.max(0, Number(existingEMIs) || 0);
  const S = Math.max(0, Number(plannedSavings) || 0);
  const B = Math.max(0, Number(liquidBalance) || 0);
  const C = Math.max(0, Number(otherUnpaidCommitments) || 0);
  const M = emergencyFundMonths === 3 ? 3 : 6;

  const dp = Math.min(P, Math.max(0, Number(downPayment) || 0));
  const rate = Math.max(0, Number(annualInterestRate) || 0);
  const n = Math.max(1, Math.min(360, Number(tenureMonths) || 12));
  const fee = Math.max(0, Number(processingFees) || 0);
  const otherUpfront = Math.max(0, Number(otherUpfrontCharges) || 0);
  const upfrontCost = round2(dp + fee + otherUpfront);

  // 1. Financed Principal & Reducing Balance EMI
  const financedPrincipal = Math.max(0, round2(P - dp));
  let monthlyEMI = 0;
  let totalInterest = 0;

  if (financedPrincipal <= 0) {
    monthlyEMI = 0;
    totalInterest = 0;
  } else if (rate === 0) {
    // 0% interest / No-Cost EMI
    monthlyEMI = round2(financedPrincipal / n);
    totalInterest = 0;
  } else {
    // Standard reducing balance formula: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
    const r = rate / 100 / 12;
    const factor = Math.pow(1 + r, n);
    monthlyEMI = round2((financedPrincipal * r * factor) / (factor - 1));
    totalInterest = Math.max(0, round2(monthlyEMI * n - financedPrincipal));
  }

  const totalCost = round2(monthlyEMI * n + upfrontCost);

  // 2. Financial Baselines
  const monthlyDisposableIncome = round2(I - E - D - S);
  const requiredEmergencyFund = round2((E + D) * M);
  const rawSpendingBalance = round2(B - requiredEmergencyFund - C);
  const availableSpendingBalance = Math.max(0, rawSpendingBalance);
  const emergencyFundShortfall = Math.max(0, round2(requiredEmergencyFund - B));

  // 3. EMI Affordability Ratio & Debt-to-Income
  let emiAffordabilityRatio = 0;
  if (monthlyDisposableIncome > 0 && monthlyEMI > 0) {
    emiAffordabilityRatio = round2((monthlyEMI / monthlyDisposableIncome) * 100);
  } else if (monthlyEMI > 0) {
    emiAffordabilityRatio = 100;
  }

  const totalMonthlyDebt = round2(D + monthlyEMI);
  const debtToIncomeRatio = I > 0 ? round2((totalMonthlyDebt / I) * 100) : 100;

  // 4. Status Determination
  let status = "NOT_AFFORDABLE";
  if (P <= 0) {
    status = "INSUFFICIENT_DATA";
  } else if (upfrontCost > availableSpendingBalance) {
    // Cannot afford upfront costs without depleting emergency fund
    status = "NOT_AFFORDABLE";
  } else if (monthlyDisposableIncome <= 0 || monthlyEMI > monthlyDisposableIncome) {
    // Monthly installment exceeds disposable income
    status = "NOT_AFFORDABLE";
  } else if (emiAffordabilityRatio <= 30) {
    status = "COMFORTABLY_AFFORDABLE";
  } else if (emiAffordabilityRatio <= 50) {
    status = "AFFORDABLE";
  } else {
    status = "RISKY";
  }

  // Debt-to-income check: If total debt > 30% of gross income, downgrade to RISKY
  if (debtToIncomeRatio > 30 && (status === "COMFORTABLY_AFFORDABLE" || status === "AFFORDABLE")) {
    status = "RISKY";
  }

  // 5. Post-Purchase Projections
  const postPurchaseBankBalance = round2(B - upfrontCost);
  const postPurchaseUnreservedBalance = Math.max(0, round2(rawSpendingBalance - upfrontCost));
  const postPurchaseMonthlyDisposableIncome = round2(monthlyDisposableIncome - monthlyEMI);
  const postPurchaseMonthlyEMIs = totalMonthlyDebt;

  // 6. Savings Timeline & Funding Gap
  let totalFundingGap = 0;
  if (upfrontCost > rawSpendingBalance) {
    totalFundingGap += round2(upfrontCost - rawSpendingBalance);
  }
  if (monthlyEMI > monthlyDisposableIncome) {
    totalFundingGap += round2((monthlyEMI - Math.max(0, monthlyDisposableIncome)) * n);
  }

  const requiredAdditionalSavings = totalFundingGap;
  let monthsRequired = 0;

  if (totalFundingGap > 0) {
    if (monthlyDisposableIncome > 0) {
      monthsRequired = Math.ceil(totalFundingGap / monthlyDisposableIncome);
    } else {
      monthsRequired = null;
    }
  }

  // 7. Reasons & Recommendations
  const reasons = [];
  reasons.push(
    `Monthly EMI of ${fmtAmt(monthlyEMI, currency)} consumes ${emiAffordabilityRatio}% of your monthly disposable income (${fmtAmt(monthlyDisposableIncome, currency)}).`
  );
  reasons.push(
    `Total monthly debt commitment (existing ${fmtAmt(D, currency)} + new ${fmtAmt(monthlyEMI, currency)}) will be ${fmtAmt(totalMonthlyDebt, currency)}, which is ${debtToIncomeRatio}% of your gross income.`
  );
  reasons.push(
    `Upfront charges (down payment + fees) of ${fmtAmt(upfrontCost, currency)} leave ${fmtAmt(postPurchaseUnreservedBalance, currency)} in uncommitted cash.`
  );

  if (rate > 0) {
    reasons.push(
      `Financing ${fmtAmt(financedPrincipal, currency)} at ${rate}% over ${n} months adds ${fmtAmt(totalInterest, currency)} in interest costs (Total cost: ${fmtAmt(totalCost, currency)}).`
    );
  } else {
    reasons.push(`Zero-interest loan: No extra interest charges incurred.`);
  }

  if (debtToIncomeRatio > 30) {
    reasons.push(
      `Warning: Total debt-to-income ratio (${debtToIncomeRatio}%) exceeds the recommended 30% safety threshold.`
    );
  }

  let recommendation = "";
  if (status === "COMFORTABLY_AFFORDABLE") {
    recommendation = `This EMI plan is comfortably sustainable. The monthly installment of ${fmtAmt(monthlyEMI, currency)} takes only ${emiAffordabilityRatio}% of your disposable surplus, and total debt remains safely below 30% of income.`;
  } else if (status === "AFFORDABLE") {
    recommendation = `The EMI of ${fmtAmt(monthlyEMI, currency)} is manageable within your current cash flow, leaving ${fmtAmt(postPurchaseMonthlyDisposableIncome, currency)}/month for other discretionary goals.`;
  } else if (status === "RISKY") {
    if (debtToIncomeRatio > 30) {
      recommendation = `Risky debt level: Committing to this EMI pushes your total debt-to-income ratio to ${debtToIncomeRatio}%, exceeding the 30% financial safety guideline. Consider a higher down payment or longer tenure.`;
    } else {
      recommendation = `Risky: This EMI consumes ${emiAffordabilityRatio}% of your monthly disposable income, leaving limited buffer for unexpected expenses.`;
    }
  } else {
    if (upfrontCost > availableSpendingBalance) {
      recommendation = `Not affordable: The upfront payment of ${fmtAmt(upfrontCost, currency)} exceeds your available liquid reserves after protecting your emergency fund (${fmtAmt(requiredEmergencyFund, currency)}).`;
    } else {
      recommendation = `Not affordable: The monthly installment of ${fmtAmt(monthlyEMI, currency)} exceeds your monthly disposable income of ${fmtAmt(monthlyDisposableIncome, currency)}.`;
    }
  }

  return {
    paymentMethod: "EMI",
    productName,
    amount: P,
    monthlyIncome: I,
    essentialExpenses: E,
    existingEMIs: D,
    plannedSavings: S,
    liquidBalance: B,
    otherUnpaidCommitments: C,
    emergencyFundMonths: M,
    currency,
    status,
    monthlyDisposableIncome,
    requiredEmergencyFund,
    availableSpendingBalance,
    emergencyFundShortfall,
    affordabilityRatio: availableSpendingBalance > 0 ? round2((upfrontCost / availableSpendingBalance) * 100) : 100,
    emiAffordabilityRatio,
    debtToIncomeRatio,
    postPurchaseBankBalance,
    postPurchaseUnreservedBalance,
    postPurchaseMonthlyDisposableIncome,
    postPurchaseMonthlyEMIs,
    requiredAdditionalSavings,
    totalFundingGap,
    monthsRequired,
    recommendation,
    reasons,
    emiDetails: {
      downPayment: dp,
      tenureMonths: n,
      annualInterestRate: rate,
      processingFee: fee,
      otherUpfrontCharges: otherUpfront,
      monthlyEMI,
      totalInterest,
      totalCost,
    },
  };
}

/**
 * Dispatches calculation based on payment method.
 */
function calculateAffordability(inputs) {
  const method = (inputs.paymentMethod || "FULL_PAYMENT").toUpperCase();
  if (method === "EMI") {
    return calculateEmiAffordability(inputs);
  }
  return calculateFullPaymentAffordability(inputs);
}

/**
 * Builds backward-compatible decision and financialSnapshot fields.
 */
function buildLegacyCompatibility(result) {
  let verdict = "NOT_AFFORDABLE";
  let verdictLabel = "NOT AFFORDABLE RIGHT NOW";
  let color = "#EF4444";
  let riskLevel = "HIGH";

  if (result.status === "COMFORTABLY_AFFORDABLE") {
    verdict = "COMFORTABLY_AFFORDABLE";
    verdictLabel = "COMFORTABLY AFFORDABLE";
    color = "#10B981"; // Emerald green
    riskLevel = "LOW";
  } else if (result.status === "AFFORDABLE") {
    verdict = "AFFORDABLE";
    verdictLabel = "AFFORDABLE";
    color = "#3B82F6"; // Blue
    riskLevel = "LOW";
  } else if (result.status === "RISKY") {
    verdict = "RISKY";
    verdictLabel = "RISKY — PROCEED WITH CAUTION";
    color = "#F59E0B"; // Amber
    riskLevel = "MEDIUM";
  } else if (result.status === "INSUFFICIENT_DATA") {
    verdict = "INSUFFICIENT_DATA";
    verdictLabel = "INSUFFICIENT DATA";
    color = "#9CA3AF";
    riskLevel = "LOW";
  }

  const immediateCost = result.paymentMethod === "EMI"
    ? (result.emiDetails.downPayment + result.emiDetails.processingFee + (result.emiDetails.otherUpfrontCharges || 0))
    : result.amount;

  return {
    ...result,
    decision: {
      verdict,
      verdictLabel,
      headline: result.recommendation.split(":")[0] || verdictLabel,
      explanation: result.recommendation,
      color,
      riskLevel,
    },
    financialSnapshot: {
      before: {
        liquidBalance: result.liquidBalance,
        availableCapacity: result.availableSpendingBalance,
        dailySafeToSpend: Math.round(result.availableSpendingBalance / 30),
        monthlyCommitted: result.existingEMIs + result.otherUnpaidCommitments,
        emergencyRunwayMonths: result.essentialExpenses > 0 ? round2(result.liquidBalance / result.essentialExpenses) : 0,
      },
      after: {
        liquidBalance: result.postPurchaseBankBalance,
        availableCapacity: result.postPurchaseUnreservedBalance,
        dailySafeToSpend: Math.round(result.postPurchaseUnreservedBalance / 30),
        monthlyCommitted: result.postPurchaseMonthlyEMIs + result.otherUnpaidCommitments,
        emergencyRunwayMonths: result.essentialExpenses > 0 ? round2(result.postPurchaseBankBalance / result.essentialExpenses) : 0,
      },
      immediateCost,
      remainingCycleDays: 30,
      protectedCommitments: result.requiredEmergencyFund + result.otherUnpaidCommitments,
    },
    alternatives: {
      additionalAmountRequired: result.totalFundingGap,
      estimatedMonthsToSave: result.monthsRequired || 0,
      suggestedMonthlySavings: result.monthlyDisposableIncome > 0 ? result.monthlyDisposableIncome : 5000,
      recommendations: result.reasons,
    },
  };
}

/**
 * Primary Service Endpoint: Analyzes purchase affordability with live or provided data.
 */
async function analyzeAffordability(userId, purchaseInput = {}) {
  // Check if financial baselines were provided by user or need live DB fetch
  let baselines = {};
  const hasBaselines =
    purchaseInput.monthlyIncome !== undefined &&
    purchaseInput.essentialExpenses !== undefined &&
    purchaseInput.liquidBalance !== undefined;

  if (hasBaselines) {
    baselines = {
      monthlyIncome: Number(purchaseInput.monthlyIncome) || 0,
      essentialExpenses: Number(purchaseInput.essentialExpenses) || 0,
      existingEMIs: Number(purchaseInput.existingEMIs) || 0,
      plannedSavings: Number(purchaseInput.plannedSavings) || 0,
      liquidBalance: Number(purchaseInput.liquidBalance) || 0,
      otherUnpaidCommitments: Number(purchaseInput.otherUnpaidCommitments) || 0,
      emergencyFundMonths: Number(purchaseInput.emergencyFundMonths) === 3 ? 3 : 6,
      currency: purchaseInput.currency || "INR",
    };
  } else {
    baselines = await getUserFinancialProfile(userId);
  }

  const combinedParams = {
    ...baselines,
    ...purchaseInput,
    userId,
  };

  const calculated = calculateAffordability(combinedParams);
  const fullSimulation = buildLegacyCompatibility(calculated);

  return {
    ...fullSimulation,
    userId,
  };
}

/**
 * Saves a simulation into the database.
 */
async function saveSimulation(userId, simulationData) {
  let sim = simulationData;
  if (!sim.status || !sim.decision) {
    sim = await analyzeAffordability(userId, simulationData);
  }
  const record = await PurchaseSimulation.create({
    ...sim,
    userId,
  });
  return record;
}

/**
 * Converts a simulation into a concrete Savings Goal.
 */
async function convertSimulationToGoal(userId, simulationId, customGoalParams = {}) {
  const sim = await PurchaseSimulation.findOne({ _id: simulationId, userId });
  if (!sim) {
    throw new Error("Purchase simulation not found.");
  }

  if (sim.isConvertedToGoal && sim.goalId) {
    const existingGoal = await SavingsGoal.findOne({ _id: sim.goalId, userId });
    if (existingGoal) {
      return { goal: existingGoal, alreadyExisted: true };
    }
  }

  const targetAmount = customGoalParams.targetAmount || sim.amount;
  const targetMonths = Math.max(1, customGoalParams.targetMonths || sim.monthsRequired || 6);
  const monthlyContribution = customGoalParams.monthlyContribution || round2(targetAmount / targetMonths);
  const targetDate = customGoalParams.targetDate || new Date(Date.now() + targetMonths * 30 * 24 * 60 * 60 * 1000);

  const goal = await SavingsGoal.create({
    userId,
    name: customGoalParams.name || `Save for ${sim.productName}`,
    targetAmount: toDecimal128(targetAmount),
    currentAmount: toDecimal128(customGoalParams.currentAmount || 0),
    monthlyContribution: toDecimal128(monthlyContribution),
    targetDate,
    category: sim.category || "Purchase",
    sourceSimulationId: sim._id,
    notes: `Created from purchase simulation for ${sim.productName} (${sim.paymentMethod})`,
  });

  sim.isConvertedToGoal = true;
  sim.goalId = goal._id;
  await sim.save();

  return { goal, alreadyExisted: false };
}

/**
 * Recalculates an existing simulation with fresh live financial balances.
 */
async function recalculateSimulation(userId, simulationId) {
  const sim = await PurchaseSimulation.findOne({ _id: simulationId, userId });
  if (!sim) {
    throw new Error("Purchase simulation not found.");
  }

  const updatedSim = await analyzeAffordability(userId, {
    productName: sim.productName,
    amount: sim.amount,
    category: sim.category,
    priority: sim.priority,
    paymentMethod: sim.paymentMethod,
    downPayment: sim.downPayment || sim.emiDetails?.downPayment,
    tenureMonths: sim.tenureMonths || sim.emiDetails?.tenureMonths,
    annualInterestRate: sim.annualInterestRate || sim.emiDetails?.annualInterestRate,
    processingFees: sim.processingFees || sim.emiDetails?.processingFee,
    otherUpfrontCharges: sim.otherUpfrontCharges || sim.emiDetails?.otherUpfrontCharges,
    emergencyFundMonths: sim.emergencyFundMonths,
  });

  Object.assign(sim, updatedSim);
  await sim.save();
  return sim;
}

module.exports = {
  getUserFinancialProfile,
  calculateFullPaymentAffordability,
  calculateEmiAffordability,
  calculateAffordability,
  analyzeAffordability,
  saveSimulation,
  convertSimulationToGoal,
  recalculateSimulation,
};
