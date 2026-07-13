const { Router } = require("express");
const { MutualFund, FixedDeposit, Liquid } = require("../models");
 
// ── Mutual Funds ──────────────────────────────────────────────────────────────
const mfRouter = Router();
 
mfRouter.get("/", async (req, res) => {
  try { 
    const USER = req.auth.userId; // 👈 Moved inside the route
    res.json(await MutualFund.find({ userId: USER })); 
  }
  catch (e) { res.status(500).json({ error: e.message }); }
});
 
mfRouter.post("/", async (req, res) => {
  try { 
    const USER = req.auth.userId; // 👈 Moved inside the route
    res.status(201).json(await MutualFund.create({ ...req.body, userId: USER })); 
  }
  catch (e) { res.status(400).json({ error: e.message }); }
});
 
mfRouter.put("/:id", async (req, res) => {
  try {
    const USER = req.auth.userId; // 👈 Moved inside the route
    const mf = await MutualFund.findOneAndUpdate(
      { _id: req.params.id, userId: USER }, req.body, { new: true }
    );
    if (!mf) return res.status(404).json({ error: "Not found" });
    res.json(mf);
  } catch (e) { res.status(400).json({ error: e.message }); }
});
 
mfRouter.delete("/:id", async (req, res) => {
  try {
    const USER = req.auth.userId; // 👈 Moved inside the route
    await MutualFund.findOneAndDelete({ _id: req.params.id, userId: USER });
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
 
mfRouter.get("/pl", async (req, res) => {
  try {
    const USER = req.auth.userId; // 👈 Moved inside the route
    const funds = await MutualFund.find({ userId: USER });
    const summary = funds.map(f => ({
      name: f.name, type: f.type, invested: f.invested,
      currentValue: f.currentValue, pl: f.pl, plPct: f.plPct,
    }));
    const totalInvested = summary.reduce((a, b) => a + b.invested, 0);
    const totalCurrent  = summary.reduce((a, b) => a + b.currentValue, 0);
    res.json({ funds: summary, totalInvested, totalCurrent, totalPL: totalCurrent - totalInvested });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
 
// ── Fixed Deposits ────────────────────────────────────────────────────────────
const fdRouter = Router();
 
fdRouter.get("/", async (req, res) => {
  try { 
    const USER = req.auth.userId; // 👈 Moved inside the route
    res.json(await FixedDeposit.find({ userId: USER })); 
  }
  catch (e) { res.status(500).json({ error: e.message }); }
});
 
fdRouter.post("/", async (req, res) => {
  try { 
    const USER = req.auth.userId; // 👈 Moved inside the route
    res.status(201).json(await FixedDeposit.create({ ...req.body, userId: USER })); 
  }
  catch (e) { res.status(400).json({ error: e.message }); }
});
 
fdRouter.put("/:id", async (req, res) => {
  try {
    const USER = req.auth.userId; // 👈 Moved inside the route
    const fd = await FixedDeposit.findOneAndUpdate(
      { _id: req.params.id, userId: USER }, req.body, { new: true }
    );
    if (!fd) return res.status(404).json({ error: "Not found" });
    res.json(fd);
  } catch (e) { res.status(400).json({ error: e.message }); }
});
 
fdRouter.delete("/:id", async (req, res) => {
  try {
    const USER = req.auth.userId; // 👈 Moved inside the route
    await FixedDeposit.findOneAndDelete({ _id: req.params.id, userId: USER });
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
 
// ── Liquid Cash ───────────────────────────────────────────────────────────────
const liquidRouter = Router();
 
liquidRouter.get("/", async (req, res) => {
  try {
    const USER = req.auth.userId; // 👈 Moved inside the route
    const liq = await Liquid.findOne({ userId: USER }) || { balance: 0 };
    res.json(liq);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
 
liquidRouter.put("/", async (req, res) => {
  try {
    const USER = req.auth.userId; // 👈 Moved inside the route
    const liq = await Liquid.findOneAndUpdate(
      { userId: USER },
      { balance: req.body.balance, lastUpdated: Date.now() },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(liq);
  } catch (e) { res.status(400).json({ error: e.message }); }
});
 
module.exports = { mfRouter, fdRouter, liquidRouter };