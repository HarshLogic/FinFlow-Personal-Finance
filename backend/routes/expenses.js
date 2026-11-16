const router   = require("express").Router();
const { Expense, Account, MerchantMapping, toDecimal128, decimalToNumber } = require("../models");
const { parseTransactionSMS } = require("../utils/transactionParser");
const { syncLegacyLiquid } = require("./accounts");

// GET /api/expenses
router.get("/", async (req, res) => {
  try {
    const USER = req.auth.userId;
    const { type, category, from, to, accountId, page = 1, limit = 50 } = req.query;
    
    const filter = { userId: USER };
    if (type)     filter.type     = type;
    if (category) filter.category = category;
    if (accountId) filter.accountId = accountId;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to)   filter.date.$lte = new Date(to);
    }
    const expenses = await Expense.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("accountId", "name type currentBalance");
    const total = await Expense.countDocuments(filter);
    res.json({ expenses, total, page: Number(page) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/expenses
router.post("/", async (req, res) => {
  try {
    const USER = req.auth.userId;
    const {
      date,
      category,
      label,
      amount,
      type = "need",
      notes = "",
      accountId,
      obligationId,
      splitExpenseId,
      source = "MANUAL",
      externalReference,
      merchant,
      paymentMethod,
    } = req.body;

    const expense = await Expense.create({
      userId: USER,
      date: date ? new Date(date) : new Date(),
      category: category || "Other",
      label: label || merchant || "Expense",
      amount: Number(amount),
      type,
      notes,
      accountId: accountId || null,
      obligationId: obligationId || null,
      splitExpenseId: splitExpenseId || null,
      source,
      externalReference: externalReference || "",
      merchant: merchant || "",
      paymentMethod: paymentMethod || "OTHER",
    });

    // If accountId provided, debit the account
    if (accountId) {
      const account = await Account.findOne({ _id: accountId, userId: USER });
      if (account) {
        const curBal = decimalToNumber(account.currentBalance);
        account.currentBalance = toDecimal128(curBal - Number(amount));
        await account.save();
        await syncLegacyLiquid(USER);
      }
    }

    res.status(201).json(expense);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// POST /api/expenses/parse-sms (Phase 3 SMS parser)
router.post("/parse-sms", async (req, res) => {
  try {
    const USER = req.auth.userId;
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required" });
    }

    // Load custom learned merchant mappings for this user
    const mappings = await MerchantMapping.find({ userId: USER });
    const userMappings = {};
    mappings.forEach(m => {
      userMappings[m.merchant.toLowerCase()] = m.category;
    });

    const parsed = parseTransactionSMS(text, userMappings);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error });
    }

    // Check for duplicates
    let isDuplicate = false;
    let duplicateReason = null;

    if (parsed.data.externalReference) {
      const existing = await Expense.findOne({
        userId: USER,
        externalReference: parsed.data.externalReference,
      });
      if (existing) {
        isDuplicate = true;
        duplicateReason = `A transaction with reference ${parsed.data.externalReference} already exists (${existing.label} - ₹${existing.amount}).`;
      }
    }

    if (!isDuplicate && parsed.data.amount && parsed.data.date) {
      const parsedDate = new Date(parsed.data.date);
      const startOfDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 0, 0, 0);
      const endOfDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 23, 59, 59);

      const existingSameDay = await Expense.findOne({
        userId: USER,
        amount: parsed.data.amount,
        date: { $gte: startOfDay, $lte: endOfDay },
        merchant: parsed.data.merchant,
      });

      if (existingSameDay) {
        isDuplicate = true;
        duplicateReason = `A similar transaction of ₹${parsed.data.amount} to "${parsed.data.merchant}" already exists on ${parsed.data.date}.`;
      }
    }

    res.json({
      success: true,
      data: {
        ...parsed.data,
        isDuplicate,
        duplicateReason,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/expenses/quick-add (Confirm and save parsed transaction)
router.post("/quick-add", async (req, res) => {
  try {
    const USER = req.auth.userId;
    const {
      amount,
      label,
      merchant,
      category = "Food",
      type = "need",
      date = new Date(),
      paymentMethod = "UPI",
      accountId,
      source = "SMS_PASTE",
      externalReference,
      notes = "",
      saveMapping = true,
      force = false,
    } = req.body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }

    // Duplicate check if not forced
    if (!force && externalReference) {
      const existing = await Expense.findOne({
        userId: USER,
        externalReference,
      });
      if (existing) {
        return res.status(409).json({
          error: "Duplicate transaction detected",
          duplicate: existing,
        });
      }
    }

    const transaction = await Expense.create({
      userId: USER,
      date: new Date(date),
      category,
      label: label || merchant || "Quick Transaction",
      amount: Number(amount),
      type,
      notes,
      accountId: accountId || null,
      source,
      externalReference: externalReference || "",
      merchant: merchant || "",
      paymentMethod,
    });

    // Debit account if accountId provided
    if (accountId) {
      const account = await Account.findOne({ _id: accountId, userId: USER });
      if (account) {
        const curBal = decimalToNumber(account.currentBalance);
        account.currentBalance = toDecimal128(curBal - Number(amount));
        await account.save();
        await syncLegacyLiquid(USER);
      }
    }

    // Save learned category mapping if requested
    if (saveMapping && merchant && merchant.trim().length > 1) {
      await MerchantMapping.findOneAndUpdate(
        { userId: USER, merchant: merchant.trim().toLowerCase() },
        { category },
        { upsert: true, new: true }
      );
    }

    res.status(201).json({
      success: true,
      message: "Transaction recorded successfully",
      transaction,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/expenses/:id
router.put("/:id", async (req, res) => {
  try {
    const USER = req.auth.userId;
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
    const USER = req.auth.userId;
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: USER });
    if (!expense) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/expenses/analytics
router.get("/analytics", async (req, res) => {
  try {
    const USER = req.auth.userId;
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

// GET /api/expenses/export
router.get("/export", async (req, res) => {
  try {
    const USER = req.auth.userId;
    const expenses = await Expense.find({ userId: USER }).sort({ date: -1 });
    
    const headers = "Date,Title,Amount,Type,Category,Merchant,PaymentMethod\n";
    const rows = expenses.map(e => {
      const date = new Date(e.date).toISOString().split('T')[0];
      const title = `"${(e.label || '').replace(/"/g, '""')}"`;
      const amount = e.amount;
      const type = e.type;
      const category = e.category || 'Other';
      const merchant = `"${(e.merchant || '').replace(/"/g, '""')}"`;
      const paymentMethod = e.paymentMethod || 'OTHER';
      return `${date},${title},${amount},${type},${category},${merchant},${paymentMethod}`;
    }).join("\n");
    
    const csvContent = headers + rows;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
    res.status(200).send(csvContent);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
