/**
 * Reducing-Balance EMI & Loan Cost Calculator
 * 
 * Formula:
 *   EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
 * 
 * Where:
 *   P = Principal financed (Purchase Price - Down Payment)
 *   r = Monthly interest rate (Annual Interest Rate / 12 / 100)
 *   n = Tenure in months
 * 
 * Zero Interest (No-cost EMI):
 *   EMI = P / n
 */

function calculateEMI({
  principal = 0,
  downPayment = 0,
  tenureMonths = 12,
  annualInterestRate = 0,
  processingFee = 0,
}) {
  const pTotal = Number(principal) || 0;
  const dp = Math.min(pTotal, Math.max(0, Number(downPayment) || 0));
  const financedPrincipal = Math.max(0, pTotal - dp);
  const n = Math.max(1, Math.min(360, Number(tenureMonths) || 12));
  const annualRate = Math.max(0, Number(annualInterestRate) || 0);
  const fee = Math.max(0, Number(processingFee) || 0);

  if (financedPrincipal <= 0) {
    return {
      principal: pTotal,
      downPayment: dp,
      financedPrincipal: 0,
      tenureMonths: n,
      annualInterestRate: annualRate,
      processingFee: fee,
      monthlyEMI: 0,
      totalInterest: 0,
      totalRepayment: dp + fee,
      totalPurchaseCost: dp + fee,
      effectiveInterestRate: 0,
      amortizationSchedule: [],
    };
  }

  let monthlyEMI = 0;
  let totalInterest = 0;

  if (annualRate === 0) {
    // 0% interest / No-Cost EMI
    monthlyEMI = Math.round((financedPrincipal / n) * 100) / 100;
    totalInterest = 0;
  } else {
    // Standard reducing balance formula
    const r = (annualRate / 100) / 12;
    const factor = Math.pow(1 + r, n);
    monthlyEMI = Math.round((financedPrincipal * r * factor / (factor - 1)) * 100) / 100;
    totalInterest = Math.max(0, Math.round(((monthlyEMI * n) - financedPrincipal) * 100) / 100);
  }

  const totalRepayment = Math.round(((monthlyEMI * n) + dp + fee) * 100) / 100;
  const totalPurchaseCost = totalRepayment;

  // Generate monthly amortization schedule
  const amortizationSchedule = [];
  let balance = financedPrincipal;
  const monthlyRate = (annualRate / 100) / 12;

  for (let m = 1; m <= n; m++) {
    const interestPart = annualRate > 0 ? Math.round((balance * monthlyRate) * 100) / 100 : 0;
    const principalPart = Math.min(balance, Math.round((monthlyEMI - interestPart) * 100) / 100);
    balance = Math.max(0, Math.round((balance - principalPart) * 100) / 100);

    amortizationSchedule.push({
      month: m,
      installment: monthlyEMI,
      principalPaid: principalPart,
      interestPaid: interestPart,
      remainingBalance: balance,
    });
  }

  return {
    principal: pTotal,
    downPayment: dp,
    financedPrincipal: Math.round(financedPrincipal * 100) / 100,
    tenureMonths: n,
    annualInterestRate: annualRate,
    processingFee: fee,
    monthlyEMI,
    totalInterest,
    totalRepayment,
    totalPurchaseCost,
    effectiveInterestRate: annualRate,
    amortizationSchedule,
  };
}

module.exports = {
  calculateEMI,
};
