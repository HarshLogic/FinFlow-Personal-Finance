const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { parseTransactionSMS } = require("../utils/transactionParser");
const { getCycleDates } = require("../services/budgetEngine");

describe("FinFlow Master Financial Flow Integration", () => {
  test("Full workflow: Account setup -> Budget config -> Bills -> SMS Parse -> Split -> Settle", () => {
    const userId = "test_user_finflow_101";

    // 1. Account Opening
    const account = {
      userId,
      name: "HDFC Salary Checking",
      type: "CHECKING",
      currentBalance: 50000.00,
      isLiquid: true,
      isActive: true,
    };
    assert.equal(account.currentBalance, 50000);

    // 2. Budget cycle configuration
    const budgetCycle = {
      userId,
      cycleStartDay: 1,
      monthlySavingsGoal: 10000,
      minSafetyBuffer: 5000,
      currency: "INR",
    };

    // 3. Recurring Obligations
    const obligations = [
      { id: "ob_rent", title: "House Rent", amount: 12000, dueDay: 5, category: "Rent", isFullyPaid: false },
      { id: "ob_wifi", title: "Airtel Broadband", amount: 1000, dueDay: 12, category: "Utilities", isFullyPaid: false },
    ];
    let remainingObligations = obligations.reduce((s, o) => s + (o.isFullyPaid ? 0 : o.amount), 0);
    assert.equal(remainingObligations, 13000);

    // Initial Safe-to-Spend
    // Liquid (50000) - Unpaid Bills (13000) - Savings (10000) - Safety (5000) = 22000
    const remainingDays = 15;
    let rawSafe = account.currentBalance - remainingObligations - budgetCycle.monthlySavingsGoal - budgetCycle.minSafetyBuffer;
    let dailySafe = Math.round((rawSafe / remainingDays) * 100) / 100;
    assert.equal(rawSafe, 22000);
    assert.equal(dailySafe, 1466.67);

    // 4. Pay Recurring Obligation (WiFi bill of 1000)
    const paidBill = obligations.find(o => o.id === "ob_wifi");
    paidBill.isFullyPaid = true;
    account.currentBalance -= paidBill.amount; // 50000 - 1000 = 49000
    remainingObligations -= paidBill.amount;   // 13000 - 1000 = 12000

    // Safe-to-Spend after bill payment remains stable:
    // Liquid (49000) - Unpaid Bills (12000) - Savings (10000) - Safety (5000) = 22000
    rawSafe = account.currentBalance - remainingObligations - budgetCycle.monthlySavingsGoal - budgetCycle.minSafetyBuffer;
    assert.equal(rawSafe, 22000);

    // 5. User receives bank SMS and parses it
    const sms = "Rs.2,000.00 debited from your account via UPI to BBQ Nation on 16-11-2026. Ref: 7894561230";
    const parsed = parseTransactionSMS(sms);
    assert.equal(parsed.success, true);
    assert.equal(parsed.data.amount, 2000);
    assert.equal(parsed.data.paymentMethod, "UPI");

    // 6. User confirms transaction and saves: Account is debited
    account.currentBalance -= parsed.data.amount; // 49000 - 2000 = 47000
    assert.equal(account.currentBalance, 47000);

    // 7. User splits this ₹2000 restaurant bill with friend Rahul (50-50)
    const totalBill = 2000;
    const friendShare = 1000;
    const personalExpense = totalBill - friendShare; // 1000
    assert.equal(personalExpense, 1000);

    const splitDebt = {
      userId,
      borrowerName: "Rahul",
      amount: friendShare,
      settledAmount: 0,
      status: "PENDING",
    };
    assert.equal(splitDebt.status, "PENDING");

    // 8. Rahul makes partial repayment of ₹400
    const partialPay = 400;
    splitDebt.settledAmount += partialPay;
    splitDebt.status = splitDebt.settledAmount >= splitDebt.amount ? "SETTLED" : "PARTIAL";
    account.currentBalance += partialPay; // Cash account receives 400
    assert.equal(splitDebt.status, "PARTIAL");
    assert.equal(account.currentBalance, 47400);

    // 9. Rahul settles remaining ₹600
    const finalPay = splitDebt.amount - splitDebt.settledAmount;
    splitDebt.settledAmount += finalPay;
    splitDebt.status = splitDebt.settledAmount >= splitDebt.amount ? "SETTLED" : "PARTIAL";
    account.currentBalance += finalPay; // Cash account receives 600
    assert.equal(splitDebt.status, "SETTLED");
    assert.equal(account.currentBalance, 48000); // 50000 - 1000 (wifi) - 1000 (personal dinner) = 48000!

    // 10. Final Verification of Safe-to-Spend
    // Liquid (48000) - Unpaid Bills (12000) - Savings (10000) - Safety (5000) = 21000
    rawSafe = account.currentBalance - remainingObligations - budgetCycle.monthlySavingsGoal - budgetCycle.minSafetyBuffer;
    assert.equal(rawSafe, 21000);
    dailySafe = Math.round((rawSafe / remainingDays) * 100) / 100;
    assert.equal(dailySafe, 1400);
  });
});
