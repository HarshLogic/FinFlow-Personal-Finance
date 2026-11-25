const router = require("express").Router();
const {
  getOrCreateFoundation,
  updateMilestones,
  completeOnboarding,
  dismissOnboarding,
} = require("../services/foundationService");
const { FINANCIAL_RULES, RULE_CATEGORIES } = require("../utils/financialRulesData");

// GET /api/financial-foundation - Fetch authenticated user's milestones & Foundation Score
router.get("/financial-foundation", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const data = await getOrCreateFoundation(userId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/financial-foundation/milestones - Toggle/update self-reported milestone
router.patch("/financial-foundation/milestones", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const data = await updateMilestones(userId, req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/financial-foundation/onboarding/complete - Save & Continue onboarding
router.post("/financial-foundation/onboarding/complete", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const milestoneData = req.body?.milestones || req.body || {};
    const data = await completeOnboarding(userId, milestoneData);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/financial-foundation/onboarding/dismiss - Skip onboarding
router.post("/financial-foundation/onboarding/dismiss", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const data = await dismissOnboarding(userId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/financial-rules - Complete 28 financial rules repository
router.get("/financial-rules", (_req, res) => {
  res.json({
    success: true,
    rules: FINANCIAL_RULES,
    categories: RULE_CATEGORIES,
    totalRules: FINANCIAL_RULES.length,
    attribution: "Inspired by Morgan Housel, The Psychology of Money",
  });
});

module.exports = router;
