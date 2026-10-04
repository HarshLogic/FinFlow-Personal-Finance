const router = require("express").Router();
const { Stock, MutualFund, FixedDeposit, Liquid, Expense } = require("../models");
 
router.get("/", async (req, res) => {
  console.log("INSIDE /api/summary ROUTE!");
  try {
    const USER = req.auth.userId; 

    const [stocks, mfs, fds, liquid, expenses] = await Promise.all([
      Stock.find({ userId: USER }),
      MutualFund.find({ userId: USER }),
      FixedDeposit.find({ userId: USER }),
      Liquid.findOne({ userId: USER }),
      Expense.find({ userId: USER }),
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
    const now = new Date();
const startOfMonth = new Date(
  now.getFullYear(),
  now.getMonth(),
  1
);

const startOfNextMonth = new Date(
  now.getFullYear(),
  now.getMonth() + 1,
  1
);

const monthlyExp = expenses.filter((e) => {
  const expenseDate = new Date(e.date);

  return (
    expenseDate >= startOfMonth &&
    expenseDate < startOfNextMonth
  );
});

const needSpend = monthlyExp
  .filter((e) => e.type === "need")
  .reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  );

const wantSpend = monthlyExp
  .filter((e) => e.type === "want")
  .reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  );

    const totalMonthlySpend = needSpend + wantSpend;
 
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
          liquid:       { value: liquidBal,   pct: ((liquidBal  / totalWealth) * 100).toFixed(1) },
          stocks:       { value: stockValue,  pct: ((stockValue / totalWealth) * 100).toFixed(1) },
          mutualFunds:  { value: mfValue,     pct: ((mfValue    / totalWealth) * 100).toFixed(1) },
          fixedDeposits:{ value: fdMaturity,  pct: ((fdMaturity / totalWealth) * 100).toFixed(1) },
        },
      },
      stocks:  { value: stockValue,  cost: stockCost,    pl: stockPL,  plPct: ((stockPL/stockCost)*100).toFixed(2) },
      mf:      { value: mfValue,     cost: mfCost,       pl: mfPL,     plPct: ((mfPL/mfCost)*100).toFixed(2) },
      fds:     { maturity: fdMaturity, principal: fdPrincipal, interest: fdInterest },
      expenses:{ needSpend, wantSpend, total: needSpend + wantSpend },
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
 
// GET /api/summary/projection?monthly=&rate=&years=
router.get("/projection", (req, res) => {
  try {
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
        multiplier:    (final.corpus / final.invested).toFixed(2),
      },
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
 
module.exports = router;