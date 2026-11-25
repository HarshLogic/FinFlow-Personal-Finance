# FinFlow — Testing Strategy & Verification Guide

## 1. Overview
FinFlow enforces a zero-regression, 100% test-passing invariant. Every automated test suite must run clean before completing any engineering assignment.

---

## 2. Test Suites & Frameworks

### 2.1 Backend Test Framework
- **Runner:** Node.js native test runner (`node:test` and `node:assert`).
- **Location:** `backend/tests/*.test.js`
- **Execution Command:**
  ```bash
  cd backend && node --test tests/*.test.js
  ```
- **Active Suites:** 9 test files / 61 automated test cases.
  1. `affordability.test.js`: Full payment vs. EMI decision engine, down payments, debt-to-income limits.
  2. `budgetEngine.test.js`: Mid-month and calendar cycle math, daily safe-to-spend, deficit handling.
  3. `endToEndFlow.test.js`: Master 21-step workflow across entire system lifecycle.
  4. `financialFoundation.test.js`: Foundation score pure math, milestone toggling, 28 financial rules integrity.
  5. `integrationFlow.test.js`: Multi-account setup, bills, SMS parsing, split debts, settlements.
  6. `monthlyReport.test.js`: Provisional vs. finalized reporting, PDF binary headers, CSV formula injection mitigation.
  7. `parser.test.js`: UPI notifications, HDFC/SBI debit cards, salary credits, custom merchant learning.
  8. `splitsAndAccounts.test.js`: Decimal128 precision arithmetic, bill splitting, partial settlements.
  9. `summary.test.js`: Total wealth, cost, profit/loss calculations across asset classes.

### 2.2 Frontend Test Framework
- **Runner:** Jest 27+ with React Testing Library (`@testing-library/react`).
- **Location:** `frontend/src/__tests__/*.test.jsx`
- **Execution Command:**
  ```bash
  cd frontend && CI=true npm test -- --watchAll=false
  ```
- **Active Suites:** 3 test files / 18 automated test cases.
  1. `dashboardComponents.test.jsx`: SafeToSpend card, Accounts widget, Obligations widget, WhoOwesMe widget.
  2. `milestonesAndRulebook.test.jsx`: Financial milestones page, score ring, Rulebook search, category filtering, rule calculators.
  3. `newFeatures.test.jsx`: Monthly CA report rendering, purchase simulator decision display, onboarding modal.

---

## 3. Production Build Verification

In addition to test runners, the React production build must compile with zero errors:
```bash
cd frontend && npm run build
```
*Expected Result:* Exit code 0, optimized production build in `frontend/build/` with zero compile warnings.

---

## 4. Test Data Isolation & Mocking Strategy

1. **Deterministic Calculation Tests:** Test fixtures for math engines (EMI calculation, runway, safe-to-spend) use pure mock input objects without connecting to live databases, guaranteeing instant execution (< 100ms per suite).
2. **Integration Tests:** Use mock Mongoose models or mock request/response cycles to validate API endpoints without altering production records.
3. **Frontend Mocks:** Axios requests are intercepted in Jest via `jest.mock("../api")`, simulating network delays and responses without requiring a live backend process.

---

## 5. Security & Boundary Testing Requirements

All future test additions must include tests for:
- **Boundary Conditions:** Zero amounts, negative numbers, division by zero in interest rate calculations.
- **Formula Injection Defense:** Verifying that CSV exports escape spreadsheet formula triggers (`=`, `+`, `-`, `@`).
- **Authorization Guarding:** Verifying that querying another user's `userId` returns 401/403 or empty sets.
- **Idempotency:** Verifying that repeated settlement requests do not over-settle peer debts beyond the remaining balance.

---

## 6. Definition of Testing Complete

No task or pull request may be merged or marked complete if:
- Any test fails or is skipped without justification.
- The backend test count drops below 61.
- The frontend test count drops below 18.
- The production build fails or emits bundle errors.
