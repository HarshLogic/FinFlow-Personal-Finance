# FinFlow — Prioritized Technical Debt Backlog

## 1. Overview
This technical debt backlog organizes verified architectural, security, database, and performance findings into a prioritized engineering roadmap.

---

## 2. Technical Debt Backlog Items

### 2.1 Security Debt

#### DEBT-SEC-01: Implement Rate Limiting on Public Endpoints
- **Problem:** No request throttling on `/api/auth/login`, `/api/auth/register`, or `/api/expenses/parse-sms`.
- **Evidence:** `server.js` and `routes/auth.js` lack rate limiting middleware.
- **Severity:** High (P1)
- **Business Impact:** Exposure to credential stuffing and brute force login attempts.
- **Recommended Improvement:** Add `express-rate-limit` (e.g. 5 requests per 15 minutes for login; 30 requests per minute for SMS parsing).
- **Estimated Effort:** Small (1–2 hours).
- **Dependencies:** None.
- **Implementation Order:** 1 (Immediate Priority).
- **Acceptance Criteria:** 6th consecutive rapid login attempt from same IP receives HTTP 429 Too Many Requests.

#### DEBT-SEC-02: Tighten Wildcard CORS Domain Matching
- **Problem:** `server.js:27` permits any origin ending in `.vercel.app`.
- **Evidence:** `origin.endsWith(".vercel.app")` matches attacker sites.
- **Severity:** High (P1)
- **Business Impact:** Potential unauthorized cross-origin requests.
- **Recommended Improvement:** Replace suffix matching with an explicit whitelist of exact domain names.
- **Estimated Effort:** Small (< 1 hour).
- **Dependencies:** None.
- **Implementation Order:** 2.
- **Acceptance Criteria:** Requests with `Origin: https://arbitrary-subdomain.vercel.app` receive CORS rejection.

---

### 2.2 Database Debt

#### DEBT-DB-01: Atomic Balance Updates via `$inc`
- **Problem:** Account balance updates execute sequentially via read-modify-write.
- **Evidence:** `expenses.js:72-74` loads `account.currentBalance`, subtracts amount in memory, and calls `account.save()`.
- **Severity:** High (P1)
- **Business Impact:** Concurrent requests can result in lost balance updates.
- **Recommended Improvement:** Convert balance mutations to atomic `Account.findOneAndUpdate({ _id, userId }, { $inc: { currentBalance: -amount } })`.
- **Estimated Effort:** Small (2 hours).
- **Dependencies:** None.
- **Implementation Order:** 3.
- **Acceptance Criteria:** Concurrent tests demonstrate zero balance drift under simultaneous requests.

#### DEBT-DB-02: MongoDB Multi-Document Transactions for Linked Writes
- **Problem:** Linked operations (e.g., creating an expense and debiting an account) run as separate uncommitted database writes.
- **Evidence:** Route controllers do not initialize Mongoose sessions or transactions.
- **Severity:** High (P1)
- **Business Impact:** Mid-transaction failures produce orphaned expense entries or desynchronized account totals.
- **Recommended Improvement:** Wrap multi-collection financial mutations in `session.withTransaction()`.
- **Estimated Effort:** Medium (4 hours).
- **Dependencies:** DEBT-DB-01.
- **Implementation Order:** 4.
- **Acceptance Criteria:** Simulated failure after expense creation aborts and rolls back entire operation.

---

### 2.3 Financial Correctness Debt

#### DEBT-FIN-01: Normalize Monetary Precision to Decimal128
- **Problem:** Transactions (`Expense`, `Income`) use standard floating-point `Number`, while accounts use `Decimal128`.
- **Evidence:** `expenseSchema` defines `amount: Number`.
- **Severity:** Medium (P2)
- **Business Impact:** Potential floating-point binary rounding errors over large multi-year transaction sets.
- **Recommended Improvement:** Migrate all currency schemas to `Schema.Types.Decimal128`.
- **Estimated Effort:** Medium (4–6 hours).
- **Dependencies:** None.
- **Implementation Order:** 5.
- **Acceptance Criteria:** `toDecimal128` used across all financial models; zero floating point precision loss in aggregations.

---

### 2.4 Architecture Debt

#### DEBT-ARCH-01: Distributed Lock for In-Process Cron Scheduler
- **Problem:** Cron jobs run in-process in `schedular.js`.
- **Evidence:** `cron.schedule()` executes directly on server startup without instance coordination.
- **Severity:** Medium (P2)
- **Business Impact:** Horizontally scaled multi-container deployments trigger duplicated monthly CA report generation.
- **Recommended Improvement:** Implement MongoDB-backed advisory locks (`CronLock` collection with lease expiration) or extract to an independent worker container.
- **Estimated Effort:** Medium (3 hours).
- **Dependencies:** None.
- **Implementation Order:** 6.
- **Acceptance Criteria:** Starting two server instances results in exactly one execution of scheduled jobs.

#### DEBT-ARCH-02: Modular Decomposition of Large UI Components
- **Problem:** `PurchaseSimulator.jsx` and `MonthlyCAReport.jsx` exceed 900+ lines of code with inline sub-widgets.
- **Evidence:** Single-file component footprints contain extensive presentation logic.
- **Severity:** Low (P3)
- **Business Impact:** Increased developer cognitive overhead when editing sub-views.
- **Recommended Improvement:** Break down large pages into modular sub-components under `src/pages/<PageName>/`.
- **Estimated Effort:** Medium (4 hours).
- **Dependencies:** None.
- **Implementation Order:** 7.
- **Acceptance Criteria:** Top-level page files reduced to < 300 LOC each; 100% test pass maintained.

---

### 2.5 Testing Debt

#### DEBT-TEST-01: End-to-End Browser Automation Suite (Playwright)
- **Problem:** Existing tests run at unit/service and isolated component levels without real browser navigation testing.
- **Evidence:** No Playwright or Cypress configurations in `package.json`.
- **Severity:** Medium (P2)
- **Business Impact:** Regressions in browser-specific behaviors or CSS layout shifts may escape unit tests.
- **Recommended Improvement:** Add Playwright test suite covering critical paths (Login -> Record Expense -> Check Safe-to-Spend -> Run Simulation).
- **Estimated Effort:** Medium (4–6 hours).
- **Dependencies:** None.
- **Implementation Order:** 8.
- **Acceptance Criteria:** Playwright tests run in CI headless mode and pass across Chromium, Firefox, and WebKit.
