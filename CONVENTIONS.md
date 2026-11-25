# FinFlow — Engineering Conventions & Standards

## 1. Overview
This document formalizes the code conventions, architecture standards, and development practices observed in the FinFlow Personal Financial Operating System. It distinguishes current project conventions from recommended future standards.

---

## 2. File & Directory Naming Conventions

### 2.1 Backend (`backend/`)
- **Routes:** `camelCase.js` (e.g., `expenses.js`, `affordability.js`, `mutualFunds.js`).
- **Services:** `camelCase.js` suffixed with `Service` or `Engine` (e.g., `affordabilityEngine.js`, `monthlyReportService.js`, `emiCalculator.js`).
- **Models:** Centralized in `backend/models/index.js` using PascalCase for exported model identifiers (`User`, `Expense`, `Account`, `PurchaseSimulation`).
- **Middleware:** `camelCase.js` (e.g., `auth.js`).
- **Cron Jobs:** `camelCase.js` (e.g., `schedular.js`).
- **Utilities:** `camelCase.js` (e.g., `transactionParser.js`, `pdfGenerator.js`, `csvGenerator.js`).
- **Tests:** `camelCase.test.js` residing in `backend/tests/` (e.g., `affordability.test.js`, `budgetEngine.test.js`).

### 2.2 Frontend (`frontend/src/`)
- **Pages:** `PascalCase.jsx` residing in `src/pages/` (e.g., `Dashboard.jsx`, `PurchaseSimulator.jsx`, `MonthlyCAReport.jsx`).
- **Components & Widgets:** `PascalCase.jsx` residing in `src/components/` (e.g., `SafeToSpendCard.jsx`, `OnboardingModal.jsx`, `RuleCalculators.jsx`).
- **Shared Utilities & Themes:** `camelCase.jsx` or `camelCase.js` (e.g., `shared.jsx`, `api.js`).
- **Context Providers:** `PascalCase.jsx` in `src/context/` (e.g., `AuthContext.jsx`).
- **Tests:** `camelCase.test.jsx` in `src/__tests__/` (e.g., `dashboardComponents.test.jsx`, `newFeatures.test.jsx`).

---

## 3. Code Style & Identifier Naming

| Entity | Current Convention | Example |
| :--- | :--- | :--- |
| **Variables & Object Keys** | `camelCase` | `liquidBalance`, `monthlyIncome` |
| **Constants** | `UPPER_SNAKE_CASE` or `camelCase` | `MONTH_NAMES`, `JWT_SECRET`, `common` |
| **Functions & Methods** | `camelCase` (descriptive verbs) | `calculateSafeToSpend()`, `generateMonthlyReport()` |
| **React Components** | `PascalCase` | `MetricCard`, `WhoOwesMeWidget` |
| **Database Fields** | `camelCase` | `borrowerName`, `settledAmount` |
| **Foreign Keys / Refs** | `camelCase` with `Id` suffix | `accountId`, `obligationId`, `userId` |
| **Boolean Flags** | Prefix with `is`, `has`, or `can` | `isLiquid`, `isProvisional`, `hasPreviousData` |

---

## 4. Architectural Layering & Separation of Concerns

```
[ HTTP Request ]
       ↓
[ Route Controller (backend/routes/) ] ── Handles HTTP status codes, query extraction, response format
       ↓
[ Service Engine (backend/services/) ] ── Enforces deterministic financial calculations & business logic
       ↓
[ Data Access (backend/models/) ]      ── Mongoose schemas, Decimal128 casting, indexes, timestamps
```

- **Rule:** Route controllers must NOT contain raw financial math or heavy iteration logic. They must delegate to services in `backend/services/`.
- **Rule:** Financial services must NEVER invoke HTTP-level primitives (`res.status`, `req.headers`). They must receive plain arguments and return deterministic objects.

---

## 5. Financial Precision & Number Representation

1. **Precision Rule:** All currency storage representing accounts, obligations, budget goals, and peer debt must use `Schema.Types.Decimal128`.
2. **IEEE 754 Warning:** Never perform direct floating point math (`0.1 + 0.2 === 0.30000000000000004`) for balances. Use `toDecimal128()` and `decimalToNumber()` rounding helpers.
3. **Frontend Tabular Figures:** All prices, metric cards, interest rates, and financial tables must enforce:
   ```css
   font-variant-numeric: tabular-nums;
   letter-spacing: -0.01em;
   ```
4. **Currency Formatting:** Default to Indian Rupee (`en-IN`) formatting:
   ```javascript
   // Format as ₹1,25,000
   Number(val).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
   ```
5. **Timezone Standardization:** All recurring dates and cron schedules must be explicitly bound to `Asia/Kolkata` (IST) to prevent month boundary skewing.

---

## 6. Error Handling & Response Contracts

### 6.1 Backend API Responses
- **Success:** Return JSON payload directly or wrapped in `{ success: true, data: ... }`.
  ```json
  { "success": true, "data": { ... } }
  ```
- **Client Errors (4xx):** Return an explicit error explanation:
  ```json
  { "error": "Invalid request parameter or missing required fields." }
  ```
- **Server Errors (500):** Catch uncaught exceptions, log server-side, and return a sanitised error:
  ```json
  { "error": "Internal server processing failure." }
  ```

### 6.2 Frontend Error Handling
- Wrap all asynchronous API calls in `try ... catch ... finally` blocks.
- Always provide accessible `<ErrorBox C={C} message={error} onRetry={fetchData} />` fallbacks for failed network states.

---

## 7. Current Conventions vs. Proposed Future Standards

| Aspect | Current Practice | Proposed Future Standard |
| :--- | :--- | :--- |
| **Linting & Formatting** | `react-app` ESLint config in frontend; no backend linter. | Add ESLint + Prettier to backend with Husky pre-commit hooks. |
| **API Client** | Ad-hoc Axios calls in `src/api.js`. | Strongly-typed API client or Zod validation schemas. |
| **Database Transactions** | Sequential Mongoose `save()` calls. | Mandatory MongoDB multi-document transactions for multi-collection writes. |
| **Global State** | Localized component state + props drilling (`C`). | React Context for theme and global notifications; lightweight hooks for server cache. |
