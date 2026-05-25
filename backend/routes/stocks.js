const router = require("express").Router();
const { Stock } = require("../models");
const dotenv = require("dotenv");
const auth = require("../middleware/auth");

dotenv.config();

router.use(auth);

router.get("/", async (req, res) => {
  try {
    const stocks = await Stock.find({ userId: req.user.id }).sort({ ticker: 1 });
    res.json(stocks);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
 
router.post("/", async (req, res) => {
router.get("/", asyncHandler(async (req, res) => {
  const stocks = await Stock.find({ userId: req.user.id }).sort({ ticker: 1 });
  res.json(stocks);
}));

router.post("/", asyncHandler(async (req, res) => {
  const stockData = req.body;
  if (!stockData.ticker || !stockData.qty || !stockData.avgPrice) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  stockData.ticker = stockData.ticker.toUpperCase();

  // Optionally fetch CMP if missing
  if (!stockData.cmp) {
    const cmpResponse = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stockData.ticker}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`);
    const cmpData = await cmpResponse.json();
    if (cmpData && cmpData["Global Quote"] && cmpData["Global Quote"]["05. price"]) {
      stockData.cmp = Number(cmpData["Global Quote"]["05. price"]);
    }
  }

  const stock = await Stock.create({ ...stockData, userId: req.user.id });
  res.status(201).json(stock);
}));

router.put("/:id", asyncHandler(async (req, res) => {
  const stock = await Stock.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id }, req.body,
    { new: true, runValidators: true }
  );
  if (!stock) return res.status(404).json({ error: "Not found" });
  res.json(stock);
}));

router.patch("/:id/cmp", asyncHandler(async (req, res) => {
  const { cmp } = req.body;
  const stock = await Stock.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { cmp },
    { new: true }
  );
  if (!stock) return res.status(404).json({ error: "Not found" });
  res.json(stock);
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  await Stock.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  res.json({ message: "Deleted" });
}));

// GET /api/stocks/pl  — P&L summary per holding
router.get("/pl", asyncHandler(async (req, res) => {
  const stocks = await Stock.find({ userId: req.user.id });
  const pl = stocks.map(s => ({
    ticker:         s.ticker,
    qty:            s.qty,
    avgPrice:       s.avgPrice,
    cmp:            s.cmp || s.avgPrice,
    invested:       s.qty * s.avgPrice,
    currentValue:   s.qty * (s.cmp || s.avgPrice),
    pl:             (s.qty * (s.cmp || s.avgPrice)) - (s.qty * s.avgPrice),
  }));

  const totalInvested = pl.reduce((s, x) => s + x.invested, 0);
  const totalCurrent  = pl.reduce((s, x) => s + x.currentValue, 0);
  res.json({ holdings: pl, totalInvested, totalCurrent, totalPL: totalCurrent - totalInvested });
}));

// POST /api/stocks/sync — manual sync
router.post("/sync", asyncHandler(async (req, res) => {
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const stocks = await Stock.find({ userId: req.user.id });
  for (const stk of stocks) {
    const cmpResponse = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stk.ticker}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`);
    const cmpData = await cmpResponse.json();
    const latestPrice = Number(cmpData["Global Quote"]?.["05. price"]);
    if (!Number.isNaN(latestPrice) && latestPrice > 0) {
      stk.cmp = latestPrice;
      await stk.save();
    }
    await sleep(15000); // 15s to respect AlphaVantage limit
  }
  res.json({ message: "Sync complete" });
}));

module.exports = router;