const router   = require("express").Router();
const { Expense } = require("../models");
const auth = require("../middleware/auth");
 
router.use(auth);
 

router.get("/", asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const expenses = await Expense.find({ userId: req.user.id })
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await Expense.countDocuments({ userId: req.user.id });
  res.json({ expenses, total, page: Number(page), pages: Math.ceil(total / limit) });
}));

router.post("/", asyncHandler(async (req, res) => {
  const expense = await Expense.create({ ...req.body, userId: req.user.id });
  res.status(201).json(expense);
}));

router.put("/:id", asyncHandler(async (req, res) => {
  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id }, req.body,
    { new: true, runValidators: true }
  );
  if (!expense) return res.status(404).json({ error: "Not found" });
  res.json(expense);
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  res.json({ message: "Deleted" });
}));

router.get("/analytics", asyncHandler(async (req, res) => {
  const pipeline = [
    { $match: { userId: req.user.id } },
    {
      $group: {
        _id: {
          month: { $month: "$date" },
          year: { $year: "$date" },
          category: "$category",
          type: "$type"
        },
        total: { $sum: "$amount" }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ];
  const analytics = await Expense.aggregate(pipeline);
  res.json(analytics);
}));

module.exports = router;