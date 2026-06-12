const router   = require("express").Router();
const { Parser } = require("json2csv");
const { Expense } = require("../models");
 
const USER = "demo_user"; // replace with JWT auth middleware later
 
// GET  /api/expenses  — list with optional filters
router.get("/", async (req, res) => {
  try {
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

// Export expenses as CSV
router.get("/export/csv", async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: "demo_user" })
      .sort({ date: -1 })
      .lean();

    const fields = [
      "date",
      "category",
      "label",
      "amount",
      "type",
      "notes",
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(expenses);

    res.header("Content-Type", "text/csv");
    res.attachment("transactions.csv");

    return res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to export CSV",
    });
  }
});
 
// POST /api/expenses
router.post("/", async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, userId: USER });
    res.status(201).json(expense);
  } catch (e) { res.status(400).json({ error: e.message }); }
});
 
// PUT  /api/expenses/:id
router.put("/:id", async (req, res) => {
  try {
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
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: USER });
    if (!expense) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
 
// GET /api/expenses/analytics  — need vs want breakdown by month
router.get("/analytics", async (req, res) => {
  try {
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