const router = require("express").Router();
const { BudgetCycle, toDecimal128, decimalToNumber } = require("../models");
const { calculateSafeToSpend } = require("../services/budgetEngine");

// GET /api/budget/safe-to-spend
router.get("/safe-to-spend", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const result = await calculateSafeToSpend(userId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/budget/cycle
router.get("/cycle", async (req, res) => {
  try {
    const userId = req.auth.userId;
    let cycle = await BudgetCycle.findOne({ userId });
    if (!cycle) {
      cycle = await BudgetCycle.create({
        userId,
        cycleStartDay: 1,
        monthlySavingsGoal: toDecimal128(0),
        minSafetyBuffer: toDecimal128(0),
        currency: "INR",
      });
    }
    res.json(cycle);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/budget/cycle
router.put("/cycle", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { cycleStartDay, monthlySavingsGoal, minSafetyBuffer, currency } = req.body;

    const updateData = {};
    if (cycleStartDay !== undefined) {
      const day = Number(cycleStartDay);
      if (day < 1 || day > 31) {
        return res.status(400).json({ error: "cycleStartDay must be between 1 and 31" });
      }
      updateData.cycleStartDay = day;
    }
    if (monthlySavingsGoal !== undefined) {
      updateData.monthlySavingsGoal = toDecimal128(monthlySavingsGoal);
    }
    if (minSafetyBuffer !== undefined) {
      updateData.minSafetyBuffer = toDecimal128(minSafetyBuffer);
    }
    if (currency) {
      updateData.currency = currency;
    }

    const cycle = await BudgetCycle.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(cycle);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
