const {
  Account,
  RecurringObligation,
  BudgetCycle,
  Expense,
  Liquid,
  decimalToNumber,
} = require("../models");

/**
 * Calculates cycle date ranges based on cycleStartDay (1-31).
 * Returns { cycleStart, cycleEnd, nextCycleStart, remainingDays, totalDays }
 */
function getCycleDates(startDay = 1, referenceDate = new Date()) {
  const ref = new Date(referenceDate);
  const refYear = ref.getFullYear();
  const refMonth = ref.getMonth(); // 0-11
  const refDay = ref.getDate();

  let cycleStartYear = refYear;
  let cycleStartMonth = refMonth;

  if (refDay < startDay) {
    // Current date is before start day; cycle started last month
    cycleStartMonth = refMonth - 1;
    if (cycleStartMonth < 0) {
      cycleStartMonth = 11;
      cycleStartYear = refYear - 1;
    }
  }

  // Safe clamp start day for the month
  const maxDaysInStartMonth = new Date(cycleStartYear, cycleStartMonth + 1, 0).getDate();
  const effectiveStartDay = Math.min(startDay, maxDaysInStartMonth);
  const cycleStart = new Date(cycleStartYear, cycleStartMonth, effectiveStartDay, 0, 0, 0, 0);

  // Next cycle starts in next month
  let nextCycleMonth = cycleStartMonth + 1;
  let nextCycleYear = cycleStartYear;
  if (nextCycleMonth > 11) {
    nextCycleMonth = 0;
    nextCycleYear = cycleStartYear + 1;
  }
  const maxDaysInNextMonth = new Date(nextCycleYear, nextCycleMonth + 1, 0).getDate();
  const effectiveNextStartDay = Math.min(startDay, maxDaysInNextMonth);
  const nextCycleStart = new Date(nextCycleYear, nextCycleMonth, effectiveNextStartDay, 0, 0, 0, 0);

  // Cycle end is millisecond before next cycle start
  const cycleEnd = new Date(nextCycleStart.getTime() - 1);

  // Total days in cycle
  const totalDays = Math.max(1, Math.round((nextCycleStart - cycleStart) / (1000 * 60 * 60 * 24)));

  // Remaining days: today until next cycle start
  // E.g., if today is last day of cycle, remainingDays is 1
  const todayMidnight = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0, 0);
  const msRemaining = nextCycleStart.getTime() - todayMidnight.getTime();
  const remainingDays = Math.max(1, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  return {
    cycleStart,
    cycleEnd,
    nextCycleStart,
    totalDays,
    remainingDays,
  };
}

/**
 * Calculates Safe-to-Spend for a user.
 */
async function calculateSafeToSpend(userId) {
  // 1. Get user's budget cycle configuration or defaults
  let budgetCycle = await BudgetCycle.findOne({ userId });
  if (!budgetCycle) {
    budgetCycle = {
      cycleStartDay: 1,
      monthlySavingsGoal: 0,
      minSafetyBuffer: 0,
      currency: "INR",
    };
  }

  const cycleStartDay = budgetCycle.cycleStartDay || 1;
  const savingsGoal = decimalToNumber(budgetCycle.monthlySavingsGoal);
  const safetyBuffer = decimalToNumber(budgetCycle.minSafetyBuffer);
  const currency = budgetCycle.currency || "INR";

  const { cycleStart, cycleEnd, remainingDays, totalDays } = getCycleDates(cycleStartDay);

  // 2. Liquid balance
  const userAccounts = await Account.find({ userId, isActive: true });
  let liquidBalance = 0;
  const liquidAccounts = [];

  if (userAccounts && userAccounts.length > 0) {
    for (const acc of userAccounts) {
      if (acc.isLiquid) {
        const bal = decimalToNumber(acc.currentBalance);
        liquidBalance += bal;
        liquidAccounts.push({
          id: acc._id,
          name: acc.name,
          type: acc.type,
          balance: bal,
        });
      }
    }
  } else {
    // Fallback to legacy Liquid cash model if no accounts set up yet
    const legacyLiquid = await Liquid.findOne({ userId });
    liquidBalance = legacyLiquid ? Number(legacyLiquid.balance || 0) : 0;
    if (liquidBalance > 0) {
      liquidAccounts.push({
        id: "legacy-cash",
        name: "Liquid Cash",
        type: "CASH",
        balance: liquidBalance,
      });
    }
  }

  // Round to 2 decimal places
  liquidBalance = Math.round(liquidBalance * 100) / 100;

  // 3. Recurring obligations for active cycle
  const obligations = await RecurringObligation.find({ userId, isActive: true });

  // Find all expenses in this cycle that link to an obligation
  const cycleObligationExpenses = await Expense.find({
    userId,
    date: { $gte: cycleStart, $lte: cycleEnd },
    obligationId: { $ne: null },
  });

  const paidByObligationId = {};
  for (const exp of cycleObligationExpenses) {
    const obId = exp.obligationId.toString();
    paidByObligationId[obId] = (paidByObligationId[obId] || 0) + Number(exp.amount || 0);
  }

  let totalObligations = 0;
  let paidObligations = 0;
  let remainingObligations = 0;
  const obligationItems = [];

  for (const ob of obligations) {
    const amount = decimalToNumber(ob.amount);
    totalObligations += amount;

    const paidInCycle = paidByObligationId[ob._id.toString()] || 0;
    // Also consider if lastPaidDate is within this cycle
    const isPaidRecently = ob.lastPaidDate && ob.lastPaidDate >= cycleStart && ob.lastPaidDate <= cycleEnd;
    const effectivePaid = Math.max(paidInCycle, isPaidRecently ? amount : 0);

    paidObligations += effectivePaid;
    const remaining = Math.max(0, amount - effectivePaid);
    remainingObligations += remaining;

    obligationItems.push({
      id: ob._id,
      title: ob.title,
      category: ob.category,
      amount,
      dueDay: ob.dueDay,
      paid: effectivePaid,
      remaining,
      isFullyPaid: remaining === 0,
      nextDueDate: ob.nextDueDate,
    });
  }

  remainingObligations = Math.round(remainingObligations * 100) / 100;

  // 4. Savings already allocated or reserved this cycle
  const savingsExpenses = await Expense.find({
    userId,
    date: { $gte: cycleStart, $lte: cycleEnd },
    category: "Savings",
  });

  const reservedSavings = savingsExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const remainingSavingsGoal = Math.max(0, Math.round((savingsGoal - reservedSavings) * 100) / 100);

  // 5. Raw Safe-to-Spend
  // RawSafeToSpend = LiquidBalance - RemainingObligations - RemainingSavingsGoal - SafetyBuffer
  const rawSafeToSpend = Math.round((liquidBalance - remainingObligations - remainingSavingsGoal - safetyBuffer) * 100) / 100;
  const monthSafeToSpend = Math.max(0, rawSafeToSpend);
  const dailySafeToSpend = Math.max(0, Math.round((monthSafeToSpend / remainingDays) * 100) / 100);
  const shortfall = rawSafeToSpend < 0 ? Math.abs(rawSafeToSpend) : 0;

  // Status calculation
  let status = "ON_TRACK";
  if (rawSafeToSpend < 0) {
    status = "SHORTFALL";
  } else if (rawSafeToSpend === 0 || dailySafeToSpend < 100) {
    status = "TIGHT";
  }

  return {
    success: true,
    data: {
      currency,
      liquidBalance,
      remainingObligations,
      remainingSavingsGoal,
      safetyBuffer,
      rawSafeToSpend,
      monthSafeToSpend,
      remainingDays,
      dailySafeToSpend,
      shortfall,
      status,
      cycle: {
        cycleStartDay,
        cycleStart: cycleStart.toISOString().split("T")[0],
        cycleEnd: cycleEnd.toISOString().split("T")[0],
        totalDays,
        remainingDays,
      },
      breakdown: {
        liquidAccounts,
        obligations: {
          total: totalObligations,
          paid: paidObligations,
          remaining: remainingObligations,
          items: obligationItems,
        },
        savings: {
          goal: savingsGoal,
          reserved: reservedSavings,
          remaining: remainingSavingsGoal,
        },
        safetyBuffer,
      },
    },
  };
}

module.exports = {
  calculateSafeToSpend,
  getCycleDates,
};
