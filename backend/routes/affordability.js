const router = require("express").Router();
const {
  getUserFinancialProfile,
  analyzeAffordability,
  saveSimulation,
  convertSimulationToGoal,
  recalculateSimulation,
} = require("../services/affordabilityEngine");
const { PurchaseSimulation, SavingsGoal, toDecimal128 } = require("../models");

// GET /api/affordability/profile - Fetch user's live financial baseline data
router.get("/profile", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const profile = await getUserFinancialProfile(userId);
    res.json({ success: true, profile, data: profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/affordability/analyze - Analyze affordability in real time
router.post("/analyze", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const result = await analyzeAffordability(userId, req.body);
    res.json({ success: true, simulation: result, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/affordability/save - Save simulation to user history
router.post("/save", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const record = await saveSimulation(userId, req.body);
    res.status(201).json({ success: true, simulation: record });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/affordability/history - List user's saved simulations
router.get("/history", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const history = await PurchaseSimulation.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/affordability/goals - List savings goals
router.get("/goals", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const goals = await SavingsGoal.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, goals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/affordability/goals - Create new savings goal manually
router.post("/goals", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { name, targetAmount, currentAmount = 0, monthlyContribution = 0, targetDate, category = "General" } = req.body;
    if (!name || !targetAmount) {
      return res.status(400).json({ error: "Goal name and target amount are required." });
    }
    const goal = await SavingsGoal.create({
      userId,
      name,
      targetAmount: toDecimal128(targetAmount),
      currentAmount: toDecimal128(currentAmount),
      monthlyContribution: toDecimal128(monthlyContribution),
      targetDate: targetDate ? new Date(targetDate) : undefined,
      category,
    });
    res.status(201).json({ success: true, goal });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/affordability/:id - Get specific simulation
router.get("/:id", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const sim = await PurchaseSimulation.findOne({ _id: req.params.id, userId });
    if (!sim) {
      return res.status(404).json({ error: "Simulation not found." });
    }
    res.json({ success: true, simulation: sim });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/affordability/:id - Delete simulation
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const deleted = await PurchaseSimulation.findOneAndDelete({ _id: req.params.id, userId });
    if (!deleted) {
      return res.status(404).json({ error: "Simulation not found." });
    }
    res.json({ success: true, message: "Simulation removed." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/affordability/:id/create-goal - Convert simulation into concrete savings goal
router.post("/:id/create-goal", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { goal, alreadyExisted } = await convertSimulationToGoal(userId, req.params.id, req.body);
    res.status(200).json({ success: true, goal, alreadyExisted });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/affordability/:id/recalculate - Recalculate simulation with fresh account balances
router.post("/:id/recalculate", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const updated = await recalculateSimulation(userId, req.params.id);
    res.json({ success: true, simulation: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
