const router = require("express").Router();
const {
  SplitExpense,
  Expense,
  Account,
  toDecimal128,
  decimalToNumber,
} = require("../models");
const { syncLegacyLiquid } = require("./accounts");

// GET /api/splits
router.get("/", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { status, borrowerName } = req.query;

    const filter = { userId };
    if (status && status !== "ALL") {
      filter.status = status;
    }
    if (borrowerName) {
      filter.borrowerName = new RegExp(borrowerName, "i");
    }

    const splits = await SplitExpense.find(filter)
      .sort({ createdAt: -1 })
      .populate("originalTransactionId", "label amount date category");

    res.json(splits);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/splits/summary
router.get("/summary", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const splits = await SplitExpense.find({ userId });

    let totalPending = 0;
    let totalSettled = 0;
    let pendingCount = 0;
    const debtorMap = {};

    for (const split of splits) {
      const amt = decimalToNumber(split.amount);
      const settled = decimalToNumber(split.settledAmount);
      const remaining = Math.max(0, amt - settled);

      totalSettled += settled;
      if (remaining > 0) {
        totalPending += remaining;
        pendingCount += 1;
        const bName = split.borrowerName.trim();
        debtorMap[bName] = (debtorMap[bName] || 0) + remaining;
      }
    }

    const topDebtors = Object.entries(debtorMap).map(([name, amount]) => ({
      name,
      amount: Math.round(amount * 100) / 100,
    })).sort((a, b) => b.amount - a.amount);

    res.json({
      totalPending: Math.round(totalPending * 100) / 100,
      totalSettled: Math.round(totalSettled * 100) / 100,
      pendingCount,
      topDebtors,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/splits
router.post("/", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const {
      originalTransactionId,
      borrowerName,
      amount,
      dueDate,
      notes = "",
      adjustOriginalExpense = false,
    } = req.body;

    if (!borrowerName || amount === undefined) {
      return res.status(400).json({ error: "borrowerName and amount are required" });
    }

    const splitAmount = Number(amount);
    if (isNaN(splitAmount) || splitAmount <= 0) {
      return res.status(400).json({ error: "Amount must be a positive number" });
    }

    let origTxn = null;
    if (originalTransactionId) {
      origTxn = await Expense.findOne({ _id: originalTransactionId, userId });
      if (!origTxn) {
        return res.status(404).json({ error: "Original transaction not found" });
      }

      // If adjustOriginalExpense is true:
      // Adjust original expense so personal expense reflects total - friend share
      if (adjustOriginalExpense) {
        const newPersonalExpense = Math.max(0, origTxn.amount - splitAmount);
        origTxn.amount = newPersonalExpense;
        origTxn.notes = (origTxn.notes ? origTxn.notes + " | " : "") + `Split ₹${splitAmount} with ${borrowerName}`;
        await origTxn.save();
      }
    }

    const split = await SplitExpense.create({
      userId,
      originalTransactionId: originalTransactionId || null,
      borrowerName: borrowerName.trim(),
      amount: toDecimal128(splitAmount),
      settledAmount: toDecimal128(0),
      status: "PENDING",
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes.trim(),
      settlements: [],
    });

    if (origTxn) {
      origTxn.splitExpenseId = split._id;
      await origTxn.save();
    }

    res.status(201).json(split);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PATCH /api/splits/:id
router.patch("/:id", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { borrowerName, amount, dueDate, notes, status } = req.body;

    const split = await SplitExpense.findOne({ _id: req.params.id, userId });
    if (!split) return res.status(404).json({ error: "Split not found" });

    if (borrowerName !== undefined) split.borrowerName = borrowerName.trim();
    if (amount !== undefined) {
      const amtNum = Number(amount);
      if (isNaN(amtNum) || amtNum <= 0) {
        return res.status(400).json({ error: "Amount must be positive" });
      }
      split.amount = toDecimal128(amtNum);
      const settled = decimalToNumber(split.settledAmount);
      if (settled >= amtNum) {
        split.status = "SETTLED";
      } else if (settled > 0) {
        split.status = "PARTIAL";
      } else {
        split.status = "PENDING";
      }
    }
    if (dueDate !== undefined) split.dueDate = dueDate ? new Date(dueDate) : null;
    if (notes !== undefined) split.notes = notes.trim();
    if (status !== undefined) split.status = status;

    await split.save();
    res.json(split);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/splits/:id/settle
router.post("/:id/settle", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { amount, accountId, notes = "" } = req.body;

    const split = await SplitExpense.findOne({ _id: req.params.id, userId });
    if (!split) return res.status(404).json({ error: "Split not found" });

    const totalAmount = decimalToNumber(split.amount);
    const alreadySettled = decimalToNumber(split.settledAmount);
    const remainingToSettle = Math.max(0, totalAmount - alreadySettled);

    if (remainingToSettle <= 0) {
      return res.status(400).json({ error: "This debt is already fully settled" });
    }

    // Default to remaining amount if not specified
    const settleAmt = amount !== undefined ? Number(amount) : remainingToSettle;
    if (isNaN(settleAmt) || settleAmt <= 0) {
      return res.status(400).json({ error: "Settlement amount must be positive" });
    }

    if (settleAmt > remainingToSettle + 0.01) {
      return res.status(400).json({
        error: `Settlement amount (₹${settleAmt}) exceeds remaining owed (₹${remainingToSettle})`,
      });
    }

    // 1. Credit the receiving account if specified
    if (accountId) {
      const account = await Account.findOne({ _id: accountId, userId });
      if (account) {
        const currentBal = decimalToNumber(account.currentBalance);
        account.currentBalance = toDecimal128(currentBal + settleAmt);
        await account.save();
        await syncLegacyLiquid(userId);
      }
    }

    // 2. Update split document
    const newSettledAmount = Math.round((alreadySettled + settleAmt) * 100) / 100;
    split.settledAmount = toDecimal128(newSettledAmount);
    split.status = newSettledAmount >= totalAmount - 0.001 ? "SETTLED" : "PARTIAL";

    split.settlements.push({
      amount: toDecimal128(settleAmt),
      settledAt: new Date(),
      accountId: accountId || null,
      notes: notes.trim(),
    });

    await split.save();

    res.json({
      success: true,
      message: `Successfully recorded settlement of ₹${settleAmt}`,
      split,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/splits/:id
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const split = await SplitExpense.findOneAndDelete({ _id: req.params.id, userId });
    if (!split) return res.status(404).json({ error: "Split not found" });
    res.json({ message: "Split deleted successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
