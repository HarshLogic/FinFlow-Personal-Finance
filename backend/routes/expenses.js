const router   = require("express").Router();
const { Expense } = require("../models");
 
router.get("/", async (req, res) => {
  try {
    const USER = req.auth.userId; // 👈 Gets the secure User ID from Clerk
    const { type, category, from, to, page = 1, limit = 50 } = req.query;
    
    const filter = { userId: USER };
    if (type)     filter.type     = type;
    if (category) filter.category = category;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to)   filter.date.$lte = new Date(to);
    }
    const expenses = await Expense.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Expense.countDocuments(filter);
    res.json({ expenses, total, page: Number(page) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
 
// POST /api/expenses
router.post("/", async (req, res) => {
  try {
    const USER = req.auth.userId; // 👈 
    const expense = await Expense.create({ ...req.body, userId: USER });
    res.status(201).json(expense);
  } catch (e) { res.status(400).json({ error: e.message }); }
});
 
// PUT  /api/expenses/:id
router.put("/:id", async (req, res) => {
  try {
    const USER = req.auth.userId; // 👈 
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: USER },
      req.body,
      { new: true, runValidators: true }
    );
    if (!expense) return res.status(404).json({ error: "Not found" });
    res.json(expense);
  } catch (e) { res.status(400).json({ error: e.message }); }
});
 
// DELETE /api/expenses/:id
router.delete("/:id", async (req, res) => {
  try {
    const USER = req.auth.userId; // 👈 
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: USER });
    if (!expense) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
 
// GET /api/expenses/analytics
router.get("/analytics", async (req, res) => {
  try {
    const USER = req.auth.userId; // 👈 
    const agg = await Expense.aggregate([
      { $match: { userId: USER } },
      { $group: {
        _id: {
          year:  { $year:  "$date" },
          month: { $month: "$date" },
          type:  "$type",
        },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      }},
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
    res.json(agg);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
 
module.exports = router;