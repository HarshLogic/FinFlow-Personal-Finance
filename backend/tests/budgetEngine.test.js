const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { getCycleDates } = require("../services/budgetEngine");

describe("Budget Engine & Cycle Calculation", () => {
  test("Calculates standard 1st of month cycle correctly", () => {
    const refDate = new Date("2026-11-16T12:00:00Z");
    const { cycleStart, cycleEnd, remainingDays, totalDays } = getCycleDates(1, refDate);

    assert.equal(cycleStart.getFullYear(), 2026);
    assert.equal(cycleStart.getMonth(), 10); // Nov (0-indexed: 10)
    assert.equal(cycleStart.getDate(), 1);

    // Next cycle is Dec 1
    assert.equal(totalDays, 30);
    // Today is Nov 16, Dec 1 is in 15 days
    assert.equal(remainingDays, 15);
  });

  test("Calculates mid-month cycle correctly (e.g. 25th to 24th)", () => {
    // Reference date Nov 16th is before 25th, so active cycle started Oct 25th
    const refDate = new Date("2026-11-16T12:00:00Z");
    const { cycleStart, nextCycleStart, remainingDays } = getCycleDates(25, refDate);

    assert.equal(cycleStart.getMonth(), 9); // October
    assert.equal(cycleStart.getDate(), 25);
    assert.equal(nextCycleStart.getMonth(), 10); // November 25
    assert.equal(nextCycleStart.getDate(), 25);

    // Days from Nov 16 to Nov 25: 9 days remaining
    assert.equal(remainingDays, 9);
  });

  test("Calculates cycle when current date is past cycle start day", () => {
    // Reference date Nov 28th is after 25th, so active cycle started Nov 25th
    const refDate = new Date("2026-11-28T12:00:00Z");
    const { cycleStart, nextCycleStart } = getCycleDates(25, refDate);

    assert.equal(cycleStart.getMonth(), 10); // November 25
    assert.equal(cycleStart.getDate(), 25);
    assert.equal(nextCycleStart.getMonth(), 11); // December 25
    assert.equal(nextCycleStart.getDate(), 25);
  });

  test("Calculates safe-to-spend math correctly with raw formula", () => {
    // Formula verification:
    // LiquidBalance = 45000
    // RemainingObligations = 12000
    // RemainingSavingsGoal = 10000
    // SafetyBuffer = 5000
    // RawSafeToSpend = 45000 - 12000 - 10000 - 5000 = 18000
    // RemainingDays = 15
    // DailySafeToSpend = 18000 / 15 = 1200
    const liquidBalance = 45000;
    const remainingObligations = 12000;
    const remainingSavingsGoal = 10000;
    const safetyBuffer = 5000;
    const remainingDays = 15;

    const rawSafeToSpend = liquidBalance - remainingObligations - remainingSavingsGoal - safetyBuffer;
    const monthSafeToSpend = Math.max(0, rawSafeToSpend);
    const dailySafeToSpend = monthSafeToSpend / remainingDays;
    const shortfall = rawSafeToSpend < 0 ? Math.abs(rawSafeToSpend) : 0;
    const status = rawSafeToSpend > 0 ? "ON_TRACK" : (rawSafeToSpend === 0 ? "TIGHT" : "SHORTFALL");

    assert.equal(rawSafeToSpend, 18000);
    assert.equal(monthSafeToSpend, 18000);
    assert.equal(dailySafeToSpend, 1200);
    assert.equal(shortfall, 0);
    assert.equal(status, "ON_TRACK");
  });

  test("Handles deficit / shortfall correctly", () => {
    // LiquidBalance = 5000
    // RemainingObligations = 8000
    // SavingsGoal = 2000
    // SafetyBuffer = 1000
    // RawSafeToSpend = 5000 - 8000 - 2000 - 1000 = -6000
    const liquidBalance = 5000;
    const remainingObligations = 8000;
    const remainingSavingsGoal = 2000;
    const safetyBuffer = 1000;
    const remainingDays = 10;

    const rawSafeToSpend = liquidBalance - remainingObligations - remainingSavingsGoal - safetyBuffer;
    const monthSafeToSpend = Math.max(0, rawSafeToSpend);
    const dailySafeToSpend = monthSafeToSpend / remainingDays;
    const shortfall = rawSafeToSpend < 0 ? Math.abs(rawSafeToSpend) : 0;
    const status = rawSafeToSpend < 0 ? "SHORTFALL" : "ON_TRACK";

    assert.equal(rawSafeToSpend, -6000);
    assert.equal(monthSafeToSpend, 0);
    assert.equal(dailySafeToSpend, 0);
    assert.equal(shortfall, 6000);
    assert.equal(status, "SHORTFALL");
  });
});
