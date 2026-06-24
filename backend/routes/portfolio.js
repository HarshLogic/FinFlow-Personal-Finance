const { Router } = require("express");
const asyncHandler = require("express-async-handler");
const { MutualFund, FixedDeposit, Liquid } = require("../models");
const auth = require("../middleware/auth");

// ── Mutual Funds ──────────────────────────────────────────────────────────────
const mfRouter = Router();
mfRouter.use(auth);

mfRouter.get("/", asyncHandler(async (req, res) => {
  res.json(await MutualFund.find({ userId: req.user.id }));
}));

mfRouter.post("/", asyncHandler(async (req, res) => {
  res.status(201).json(await MutualFund.create({ ...req.body, userId: req.user.id }));
}));

mfRouter.put("/:id", asyncHandler(async (req, res) => {
  const mf = await MutualFund.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id }, req.body, { new: true }
  );
  if (!mf) return res.status(404).json({ error: "Not found" });
  res.json(mf);
}));

mfRouter.delete("/:id", asyncHandler(async (req, res) => {
  await MutualFund.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  res.json({ message: "Deleted" });
}));

mfRouter.get("/pl", asyncHandler(async (req, res) => {
  const funds = await MutualFund.find({ userId: req.user.id });
  const summary = funds.map(f => ({
    name: f.name, type: f.type, invested: f.invested,
    currentValue: f.currentValue, pl: f.pl, plPct: f.plPct,
  }));
  res.json(summary);
}));

// ── Fixed Deposits ────────────────────────────────────────────────────────────
const fdRouter = Router();
fdRouter.use(auth);

fdRouter.get("/", asyncHandler(async (req, res) => {
  res.json(await FixedDeposit.find({ userId: req.user.id }));
}));

fdRouter.post("/", asyncHandler(async (req, res) => {
  res.status(201).json(await FixedDeposit.create({ ...req.body, userId: req.user.id }));
}));

fdRouter.put("/:id", asyncHandler(async (req, res) => {
  const fd = await FixedDeposit.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id }, req.body, { new: true }
  );
  if (!fd) return res.status(404).json({ error: "Not found" });
  res.json(fd);
}));

fdRouter.delete("/:id", asyncHandler(async (req, res) => {
  await FixedDeposit.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  res.json({ message: "Deleted" });
}));

// ── Liquid Cash ───────────────────────────────────────────────────────────────
const liquidRouter = Router();
liquidRouter.use(auth);

liquidRouter.get("/", asyncHandler(async (req, res) => {
  const liq = await Liquid.findOne({ userId: req.user.id }) || { balance: 0 };
  res.json(liq);
}));

liquidRouter.put("/", asyncHandler(async (req, res) => {
  const liq = await Liquid.findOneAndUpdate(
    { userId: req.user.id },
    { balance: req.body.balance, lastUpdated: Date.now() },
    { new: true, upsert: true, runValidators: true }
  );
  res.json(liq);
}));

module.exports = { mfRouter, fdRouter, liquidRouter };