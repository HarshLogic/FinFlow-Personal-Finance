const router = require("express").Router();
const { MutualFund } = require("../models");
const USER = "demo_user";
 
 
// GET /api/mutualfunds/pl
router.get("/pl", async (req, res) => {
  const funds = await MutualFund.find({ userId: USER });
  const summary = funds.map(f => ({
    name: f.name, type: f.type,
    invested: f.invested, currentValue: f.currentValue,
    pl: f.pl, plPct: f.plPct,
  }));
  const totalInvested = summary.reduce((a,b)=>a+b.invested, 0);
  const totalCurrent  = summary.reduce((a,b)=>a+b.currentValue, 0);
  res.json({ funds: summary, totalInvested, totalCurrent, totalPL: totalCurrent - totalInvested });
});
 
module.exports = router;
