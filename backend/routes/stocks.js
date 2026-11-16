const router = require("express").Router();
const { Stock } = require("../models");
const dotenv = require("dotenv");
dotenv.config();

const toPositiveNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
};

router.get("/", async (req, res) => {
  try {
    const USER = req.auth.userId; // 👈 Scoped inside the route
    const stocks = await Stock.find({ userId: USER }).sort({ ticker: 1 });
    res.json(stocks);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
 
router.post("/", async (req, res) => {
  try {
    const USER = req.auth.userId;
    const stockData = { ...req.body };
    const keyword = stockData.ticker;
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    if (process.env.ALPHA_VANTAGE_API_KEY && keyword) {
      try {
        const tickerResponse = await fetch(`https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${keyword}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`);
        const tickerData = await tickerResponse.json();

        if (tickerData["bestMatches"]?.length) {
          const tickerResult = tickerData["bestMatches"].filter(m => 
            m["4. region"]?.includes("India") && m["2. name"]?.toLowerCase().includes(keyword.toLowerCase())
          );
          if (tickerResult.length) {
            stockData.ticker = tickerResult[0]["1. symbol"].toUpperCase();
            stockData.companyName = tickerResult[0]["2. name"];
          }
        }

        await sleep(1000);

        const cmpResponse = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stockData.ticker}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`);
        const cmpData = await cmpResponse.json();
        const fetchedCmp = toPositiveNumber(cmpData["Global Quote"]?.["05. price"]);
        if (fetchedCmp !== null) {
          stockData.cmp = fetchedCmp;
        }
      } catch (apiErr) {
        console.warn("AlphaVantage stock lookup notice:", apiErr.message);
      }
    }

    if (!stockData.cmp) {
      stockData.cmp = toPositiveNumber(stockData.avgPrice) || Number(stockData.avgPrice) || 0;
    }

    if (!stockData.ticker || !stockData.qty || !stockData.avgPrice) {
      return res.status(400).json({ error: "Ticker, quantity, and avgPrice are required" });
    }

    const stock = await Stock.create({ ...stockData, userId: USER });
    res.status(201).json(stock);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
 
router.put("/:id", async (req, res) => {
  try {
    const USER = req.auth.userId; // 👈 Scoped inside the route
    const updateData = { ...req.body };

    if (updateData.cmp !== undefined) {
      const cmpValue = toPositiveNumber(updateData.cmp);
      if (cmpValue === null) {
        return res.status(400).json({ error: "CMP must be a positive number" });
      }
      updateData.cmp = cmpValue;
    }

    const stock = await Stock.findOneAndUpdate(
      { _id: req.params.id, userId: USER }, updateData,
      { new: true, runValidators: true }
    );
    if (!stock) return res.status(404).json({ error: "Not found" });
    res.json(stock);
  } catch (e) { res.status(400).json({ error: e.message }); }
});
 
// PATCH /api/stocks/:id/cmp  — update live price
router.patch("/:id/cmp", async (req, res) => {
  try {
    const USER = req.auth.userId; // 👈 Scoped inside the route
    const cmpValue = toPositiveNumber(req.body.cmp);
    if (cmpValue === null) {
      return res.status(400).json({ error: "CMP must be a positive number" });
    }

    const stock = await Stock.findOneAndUpdate(
      { _id: req.params.id, userId: USER },
      { cmp: cmpValue },
      { new: true, runValidators: true }
    );
    if (!stock) return res.status(404).json({ error: "Not found" });
    res.json(stock);
  } catch (e) { res.status(400).json({ error: e.message }); }
});
 
router.delete("/:id", async (req, res) => {
  try {
    const USER = req.auth.userId; // 👈 Scoped inside the route
    await Stock.findOneAndDelete({ _id: req.params.id, userId: USER });
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
 
// GET /api/stocks/pl  — P&L summary per holding
router.get("/pl", async (req, res) => {
  try {
    const USER = req.auth.userId; // 👈 Scoped inside the route
    const stocks = await Stock.find({ userId: USER });
    const pl = stocks.map(s => ({
      ticker:         s.ticker,
      qty:            s.qty,
      avgPrice:       s.avgPrice,
      cmp:            s.cmp,
      investedValue:  s.investedValue,
      currentValue:   s.currentValue,
      pl:             s.pl,
      plPct:          s.plPct,
    }));
    const totalInvested = pl.reduce((a, b) => a + b.investedValue, 0);
    const totalCurrent  = pl.reduce((a, b) => a + b.currentValue,  0);
    res.json({ holdings: pl, totalInvested, totalCurrent, totalPL: totalCurrent - totalInvested });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
 
module.exports = router;