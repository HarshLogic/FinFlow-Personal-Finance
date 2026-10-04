const router = require("express").Router();
const { Income } = require("../models");

// GET /api/income
router.get("/", async (req, res) => {
  try {
    const USER = req.auth.userId;
    const { from, to } = req.query;
    
    const filter = { userId: USER };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to)   filter.date.$lte = new Date(to);
    }
    
    const income = await Income.find(filter).sort({ date: -1 });
    res.json(income);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/income
router.post("/", async (req, res) => {
  try {
    const USER = req.auth.userId;
    const income = await Income.create({ ...req.body, userId: USER });
    res.status(201).json(income);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/income/:id
router.put("/:id", async (req, res) => {
  try {
    const USER = req.auth.userId;
    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, userId: USER },
      req.body,
      { new: true, runValidators: true }
    );
    if (!income) return res.status(404).json({ error: "Not found" });
    res.json(income);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/income/:id
router.delete("/:id", async (req, res) => {
  try {
    const USER = req.auth.userId;
    const income = await Income.findOneAndDelete({ _id: req.params.id, userId: USER });
    if (!income) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
