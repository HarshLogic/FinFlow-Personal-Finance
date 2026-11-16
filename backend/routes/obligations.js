const router = require("express").Router();
const {
  RecurringObligation,
  Account,
  Expense,
  toDecimal128,
  decimalToNumber,
} = require("../models");
const { syncLegacyLiquid } = require("./accounts");

/**
 * Calculates the next due date based on dueDay and frequency.
 */
function calculateNextDueDate(dueDay, frequency = "MONTHLY", fromDate = new Date()) {
  const d = new Date(fromDate);
  const year = d.getFullYear();
  const month = d.getMonth();
  const todayDate = d.getDate();

  if (frequency === "MONTHLY") {
    let targetYear = year;
    let targetMonth = month;

    if (todayDate > dueDay) {
      targetMonth += 1;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear += 1;
      }
    }

    const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
    const effectiveDay = Math.min(dueDay, maxDays);
    return new Date(targetYear, targetMonth, effectiveDay, 0, 0, 0, 0);
  } else if (frequency === "YEARLY") {
    let targetYear = year;
    const maxDays = new Date(targetYear, month + 1, 0).getDate();
    const effectiveDay = Math.min(dueDay, maxDays);
    let target = new Date(targetYear, month, effectiveDay, 0, 0, 0, 0);
    if (target < d) {
      target.setFullYear(targetYear + 1);
    }
    return target;
  } else if (frequency === "WEEKLY") {
    const nextWeek = new Date(d);
    nextWeek.setDate(d.getDate() + 7);
    return nextWeek;
  }

  return new Date();
}

// GET /api/obligations
router.get("/", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const obligations = await RecurringObligation.find({ userId, isActive: true }).sort({ dueDay: 1 });
    res.json(obligations);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/obligations
router.post("/", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { title, amount, dueDay, category = "Utilities", frequency = "MONTHLY", accountId } = req.body;

    if (!title || amount === undefined || dueDay === undefined) {
      return res.status(400).json({ error: "Title, amount, and dueDay are required" });
    }

    const dayNum = Number(dueDay);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      return res.status(400).json({ error: "dueDay must be a number between 1 and 31" });
    }

    const amtNum = Number(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      return res.status(400).json({ error: "Amount must be a positive number" });
    }

    const nextDueDate = calculateNextDueDate(dayNum, frequency);

    const obligation = await RecurringObligation.create({
      userId,
      title: title.trim(),
      amount: toDecimal128(amtNum),
      dueDay: dayNum,
      category,
      frequency,
      accountId: accountId || null,
      isActive: true,
      nextDueDate,
    });

    res.status(201).json(obligation);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/obligations/:id
router.put("/:id", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { title, amount, dueDay, category, frequency, accountId, isActive } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (amount !== undefined) updateData.amount = toDecimal128(amount);
    if (dueDay !== undefined) {
      const day = Number(dueDay);
      if (day < 1 || day > 31) {
        return res.status(400).json({ error: "dueDay must be between 1 and 31" });
      }
      updateData.dueDay = day;
      updateData.nextDueDate = calculateNextDueDate(day, frequency || "MONTHLY");
    }
    if (category !== undefined) updateData.category = category;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (accountId !== undefined) updateData.accountId = accountId || null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const obligation = await RecurringObligation.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!obligation) return res.status(404).json({ error: "Obligation not found" });

    res.json(obligation);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/obligations/:id
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const obligation = await RecurringObligation.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: { isActive: false } },
      { new: true }
    );
    if (!obligation) return res.status(404).json({ error: "Obligation not found" });

    res.json({ message: "Obligation deleted successfully", obligation });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/obligations/:id/pay (Record payment for an obligation)
router.post("/:id/pay", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { accountId, amount, date = new Date(), notes } = req.body;

    const obligation = await RecurringObligation.findOne({ _id: req.params.id, userId, isActive: true });
    if (!obligation) return res.status(404).json({ error: "Obligation not found" });

    const payAmount = amount !== undefined ? Number(amount) : decimalToNumber(obligation.amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ error: "Invalid payment amount" });
    }

    const chosenAccountId = accountId || obligation.accountId;

    // 1. Create linked expense
    const expense = await Expense.create({
      userId,
      date: new Date(date),
      category: obligation.category || "Utilities",
      label: `Bill: ${obligation.title}`,
      amount: payAmount,
      type: "need",
      obligationId: obligation._id,
      accountId: chosenAccountId || null,
      notes: notes || `Paid recurring obligation: ${obligation.title}`,
      source: "MANUAL",
    });

    // 2. If accountId provided, debit the account
    if (chosenAccountId) {
      const account = await Account.findOne({ _id: chosenAccountId, userId });
      if (account) {
        const currentBal = decimalToNumber(account.currentBalance);
        account.currentBalance = toDecimal128(currentBal - payAmount);
        await account.save();
        await syncLegacyLiquid(userId);
      }
    }

    // 3. Update obligation lastPaidDate and nextDueDate
    obligation.lastPaidDate = new Date(date);
    obligation.lastPaidTransactionId = expense._id;
    // Advance nextDueDate
    const nextMonth = new Date(date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    obligation.nextDueDate = calculateNextDueDate(obligation.dueDay, obligation.frequency, nextMonth);
    await obligation.save();

    res.json({
      success: true,
      message: "Obligation payment recorded successfully",
      obligation,
      expense,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
