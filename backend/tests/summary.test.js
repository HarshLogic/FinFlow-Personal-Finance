const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

describe("Summary Metrics & Wealth Allocation", () => {
  test("Safe percentage calculation with zero total wealth", () => {
    const liquidBal = 0;
    const stockValue = 0;
    const mfValue = 0;
    const fdMaturity = 0;
    const totalWealth = liquidBal + stockValue + mfValue + fdMaturity;

    const calcPct = (val, total) => total ? ((val / total) * 100).toFixed(1) : "0.0";

    assert.equal(calcPct(liquidBal, totalWealth), "0.0");
    assert.equal(calcPct(stockValue, totalWealth), "0.0");
    assert.equal(calcPct(mfValue, totalWealth), "0.0");
    assert.equal(calcPct(fdMaturity, totalWealth), "0.0");
  });

  test("Calculates total wealth, cost, and P&L across asset classes", () => {
    const liquidBal = 50000;
    const stocks = [
      { qty: 10, avgPrice: 1000, cmp: 1200 }, // cost 10000, value 12000, PL +2000
    ];
    const mfs = [
      { invested: 20000, currentValue: 25000 }, // cost 20000, value 25000, PL +5000
    ];
    const fds = [
      { principal: 30000, maturityAmount: 34500 }, // principal 30000, interest +4500
    ];

    const stockCost = stocks.reduce((s, st) => s + st.qty * st.avgPrice, 0);
    const stockValue = stocks.reduce((s, st) => s + st.qty * st.cmp, 0);
    const stockPL = stockValue - stockCost;

    const mfCost = mfs.reduce((s, m) => s + m.invested, 0);
    const mfValue = mfs.reduce((s, m) => s + m.currentValue, 0);
    const mfPL = mfValue - mfCost;

    const fdPrincipal = fds.reduce((s, fd) => s + fd.principal, 0);
    const fdMaturity = fds.reduce((s, fd) => s + fd.maturityAmount, 0);
    const fdInterest = fdMaturity - fdPrincipal;

    const totalWealth = liquidBal + stockValue + mfValue + fdMaturity;
    const totalInvested = stockCost + mfCost + fdPrincipal + liquidBal;
    const totalPL = stockPL + mfPL + fdInterest;

    assert.equal(stockPL, 2000);
    assert.equal(mfPL, 5000);
    assert.equal(fdInterest, 4500);
    assert.equal(totalWealth, 50000 + 12000 + 25000 + 34500); // 121500
    assert.equal(totalInvested, 10000 + 20000 + 30000 + 50000); // 110000
    assert.equal(totalPL, 11500);
  });
});
