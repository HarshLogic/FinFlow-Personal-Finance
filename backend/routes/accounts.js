const router = require("express").Router();
const { Account, Liquid, toDecimal128, decimalToNumber } = require("../models");

// Helper to sync legacy Liquid balance from active liquid accounts
async function syncLegacyLiquid(userId) {
  try {
    const liquidAccounts = await Account.find({ userId, isActive: true, isLiquid: true });
    const totalLiquid = liquidAccounts.reduce((sum, acc) => sum + decimalToNumber(acc.currentBalance), 0);
    await Liquid.findOneAndUpdate(
      { userId },
      { balance: totalLiquid, lastUpdated: new Date() },
      { upsert: true }
    );
  } catch (err) {
    console.error("Error syncing legacy liquid:", err);
  }
}

// GET /api/accounts
router.get("/", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const accounts = await Account.find({ userId, isActive: true }).sort({ createdAt: 1 });
    res.json(accounts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/accounts
router.post("/", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { name, type, currentBalance, openingBalance, currency = "INR", isLiquid = true } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: "Name and type are required" });
    }

    const validTypes = ["CHECKING", "SAVINGS", "WALLET", "CASH"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid account type. Must be one of: ${validTypes.join(", ")}` });
    }

    const balanceVal = currentBalance !== undefined ? currentBalance : (openingBalance !== undefined ? openingBalance : 0);
    const balanceNum = Number(balanceVal);
    if (isNaN(balanceNum)) {
      return res.status(400).json({ error: "Balance must be a valid number" });
    }

    const account = await Account.create({
      userId,
      name: name.trim(),
      type,
      currentBalance: toDecimal128(balanceNum),
      currency,
      isLiquid: Boolean(isLiquid),
      isActive: true,
    });

    await syncLegacyLiquid(userId);

    res.status(201).json(account);
  } catch (e) {
    if (e.code === 11000) {
      return res.status(400).json({ error: "An account with this name already exists" });
    }
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/accounts/:id
router.put("/:id", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { name, type, currentBalance, isLiquid, isActive } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (type !== undefined) {
      const validTypes = ["CHECKING", "SAVINGS", "WALLET", "CASH"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: `Invalid account type` });
      }
      updateData.type = type;
    }
    if (currentBalance !== undefined) {
      updateData.currentBalance = toDecimal128(currentBalance);
    }
    if (isLiquid !== undefined) updateData.isLiquid = Boolean(isLiquid);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!account) return res.status(404).json({ error: "Account not found" });

    await syncLegacyLiquid(userId);

    res.json(account);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/accounts/:id
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: { isActive: false } },
      { new: true }
    );
    if (!account) return res.status(404).json({ error: "Account not found" });

    await syncLegacyLiquid(userId);

    res.json({ message: "Account deleted successfully", account });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = { accountRouter: router, syncLegacyLiquid };
