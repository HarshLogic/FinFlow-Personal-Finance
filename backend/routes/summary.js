const router = require("express").Router();
const asyncHandler = require("express-async-handler");
const { Stock, MutualFund, FixedDeposit, Liquid, Expense } = require("../models");
const auth = require("../middleware/auth");

router.use(auth);

// GET /api/summary  — Full portfolio snapshot
router.get("/", asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [stocks, mfs, fds, liquid, monthlyExp] = await Promise.all([
    Stock.find({ userId: req.user.id }),
    MutualFund.find({ userId: req.user.id }),
    FixedDeposit.find({ userId: req.user.id }),
    Liquid.findOne({ userId: req.user.id }),
    Expense.find({ userId: req.user.id, date: { $gte: startOfMonth } }),
  ]);

  // ── Stock metrics ─────────────────────────────────────────────────────────
  const stockValue    = stocks.reduce((s, st) => s + st.qty * st.cmp, 0);
  const stockCost     = stocks.reduce((s, st) => s + st.qty * st.avgPrice, 0);
  const stockPL       = stockValue - stockCost;

  // ── MF metrics ────────────────────────────────────────────────────────────
  const mfValue       = mfs.reduce((s, m) => s + m.currentValue, 0);
  const mfCost        = mfs.reduce((s, m) => s + m.invested, 0);
  const mfPL          = mfValue - mfCost;

  // ── FD metrics ────────────────────────────────────────────────────────────
  const fdMaturity    = fds.reduce((s, fd) => s + fd.maturityAmount, 0);
  const fdPrincipal   = fds.reduce((s, fd) => s + fd.principal, 0);
  const fdInterest    = fdMaturity - fdPrincipal;

  // ── Cash ──────────────────────────────────────────────────────────────────
  const liquidBal     = liquid?.balance ?? 0;

  // ── Expense analytics ─────────────────────────────────────────────────────
  const needSpend  = monthlyExp.filter(e => e.type === "need").reduce((s, e) => s + e.amount, 0);
  const wantSpend  = monthlyExp.filter(e => e.type === "want").reduce((s, e) => s + e.amount, 0);

  // ── Total wealth ──────────────────────────────────────────────────────────
  const totalWealth   = liquidBal + stockValue + mfValue + fdMaturity;
  const totalInvested = stockCost + mfCost + fdPrincipal + liquidBal;
  const totalPL       = stockPL + mfPL + fdInterest;

  res.json({
    summary: {
      totalWealth,
      totalInvested,
      totalPL,
      allocation: {
        liquid:       { value: liquidBal,   pct: totalWealth ? ((liquidBal  / totalWealth) * 100).toFixed(1) : 0 },
        stocks:       { value: stockValue,  pct: totalWealth ? ((stockValue / totalWealth) * 100).toFixed(1) : 0 },
        mutualFunds:  { value: mfValue,     pct: totalWealth ? ((mfValue    / totalWealth) * 100).toFixed(1) : 0 },
        fixedDeposits:{ value: fdMaturity,  pct: totalWealth ? ((fdMaturity / totalWealth) * 100).toFixed(1) : 0 },
      },
    },
    stocks:  { value: stockValue,  cost: stockCost,    pl: stockPL,  plPct: stockCost ? ((stockPL/stockCost)*100).toFixed(2) : 0 },
    mf:      { value: mfValue,     cost: mfCost,       pl: mfPL,     plPct: mfCost ? ((mfPL/mfCost)*100).toFixed(2) : 0 },
    fds:     { maturity: fdMaturity, principal: fdPrincipal, interest: fdInterest },
    expenses:{ needSpend, wantSpend, total: needSpend + wantSpend },
  });
}));

// GET /api/summary/projection?monthly=&rate=&years=
router.get("/projection", asyncHandler(async (req, res) => {
  const monthly = Number(req.query.monthly) || 10000;
  const rate    = Number(req.query.rate)    || 12;      // annual %
  const years   = Number(req.query.years)   || 20;

  const r  = rate / 100 / 12;
  const data = [];

  for (let y = 0; y <= years; y++) {
    const n      = y * 12;
    const corpus = monthly * (Math.pow(1 + r, n) - 1) / r;
    const invested = monthly * n;
    data.push({
      year:       y,
      corpus:     Math.round(corpus),
      invested:   Math.round(invested),
      wealthGain: Math.round(corpus - invested),
    });
  }

  const final = data[years];
  res.json({
    params: { monthly, rate, years },
    projection: data,
    summary: {
      finalCorpus:   final.corpus,
      totalInvested: final.invested,
      wealthCreated: final.wealthGain,
      multiplier:    final.invested ? (final.corpus / final.invested).toFixed(2) : 0,
    },
  });
}));

module.exports = router;