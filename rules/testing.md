# Testing & Verification Standards

## 1. Testing Hierarchy & Pyramid
1. **Unit Tests (Core Math):** Test math engines with pure, isolated inputs (`affordabilityEngine`, `budgetEngine`, `emiCalculator`, `financialHealthService`).
2. **Integration Tests (API & Data):** Test API routes and Mongoose query pipelines using mock databases or isolated test environments.
3. **End-to-End Tests:** Verify end-to-end user lifecycles across accounts, budgets, expenses, splits, and reports.

---

## 2. Test Execution Invariants
- **Backend Test Runner:** Node.js native test runner:
  ```bash
  cd backend && node --test tests/*.test.js
  ```
  *Baseline Requirement:* Minimum 61 tests passing with 0 failures.
- **Frontend Test Runner:** Jest with React Testing Library:
  ```bash
  cd frontend && CI=true npm test -- --watchAll=false
  ```
  *Baseline Requirement:* Minimum 18 tests passing with 0 failures.
- **Build Verification:**
  ```bash
  cd frontend && npm run build
  ```
  *Baseline Requirement:* Exit code 0 with zero warnings.

---

## 3. Test Data Safety
- Tests must NEVER run against production MongoDB instances.
- Never commit test scripts that purge live collections without an explicit check for `process.env.NODE_ENV === "test"`.
- Clean up test-created files or temporary records upon test completion.
