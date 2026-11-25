# FinFlow — REST API Reference & Specification

## 1. Global Conventions & Authentication
- **Base URL:** `/api`
- **Security:** All endpoints except `/api/auth/register`, `/api/auth/login`, and `/api/auth/google` require a valid JWT Bearer token:
  ```http
  Authorization: Bearer <token>
  ```
- **Content Type:** `application/json` (except export endpoints which return binary blobs: `application/pdf` or `text/csv`).
- **User Scoping:** Every authenticated endpoint scopes queries and mutations to `req.auth.userId`.

---

## 2. API Endpoint Catalog

### 2.1 Authentication (`/api/auth`)
| Method | Endpoint | Auth | Purpose | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | None | Register new user via email, username & password. | 201, 400, 500 |
| `POST` | `/api/auth/login` | None | Authenticate with identifier (email/username) and password. | 200, 400, 401, 500 |
| `POST` | `/api/auth/google` | None | Authenticate or register with Google OAuth credential token. | 200, 401 |
| `GET` | `/api/auth/me` | Bearer | Retrieve profile information for the authenticated user. | 200, 401, 404 |
| `POST` | `/api/auth/change-password` | Bearer | Update user password after validating existing password. | 200, 400, 401, 500 |

### 2.2 Expenses & Transactions (`/api/expenses`)
| Method | Endpoint | Auth | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/expenses` | Bearer | Paginated transaction list with optional filters (`type`, `category`, `accountId`, `from`, `to`). | 200, 500 |
| `POST` | `/api/expenses` | Bearer | Record new transaction. If `accountId` is provided, automatically debits the account. | 201, 400 |
| `PUT` | `/api/expenses/:id` | Bearer | Update an existing transaction record owned by user. | 200, 400, 404 |
| `DELETE` | `/api/expenses/:id` | Bearer | Remove transaction record. If linked to an account, restores account balance. | 200, 404, 500 |
| `POST` | `/api/expenses/parse-sms` | Bearer | Parse raw banking SMS text using regex and user merchant mappings. | 200, 400 |
| `POST` | `/api/expenses/quick-add` | Bearer | Confirm and save parsed SMS transaction. Updates merchant memory. | 201, 400 |
| `GET` | `/api/expenses/analytics` | Bearer | Aggregated category spending and need vs. want percentages. | 200, 500 |
| `GET` | `/api/expenses/export` | Bearer | Download transaction history as an RFC 4180 CSV spreadsheet. | 200, 500 |

### 2.3 Accounts & Liquidity (`/api/accounts`)
| Method | Endpoint | Auth | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/accounts` | Bearer | List all active accounts, liquid balances, and total liquid net worth. | 200, 500 |
| `POST` | `/api/accounts` | Bearer | Create a new checking, savings, wallet, or cash account. | 201, 400 |
| `PUT` | `/api/accounts/:id` | Bearer | Update account details or adjust balance. Syncs legacy liquid record. | 200, 400, 404 |
| `DELETE` | `/api/accounts/:id` | Bearer | Soft-deletes account (`isActive: false`). Syncs liquid total. | 200, 404 |

### 2.4 Budget & Safe-to-Spend (`/api/budget`)
| Method | Endpoint | Auth | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/budget/safe-to-spend` | Bearer | Calculates daily Safe-to-Spend based on liquid cash, obligations, and cycle days. | 200, 500 |
| `GET` | `/api/budget/cycle` | Bearer | Retrieve user's configured budget cycle start day and savings targets. | 200, 500 |
| `PUT` | `/api/budget/cycle` | Bearer | Update cycle start day (1-31), monthly savings goal, or safety buffer. | 200, 400 |

### 2.5 Recurring Obligations (`/api/obligations`)
| Method | Endpoint | Auth | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/obligations` | Bearer | List recurring obligations, active bills, and total monthly commitments. | 200, 500 |
| `POST` | `/api/obligations` | Bearer | Create a recurring bill/EMI with due day (1-31) and frequency. | 201, 400 |
| `PUT` | `/api/obligations/:id` | Bearer | Modify an obligation's amount, due day, or active status. | 200, 400, 404 |
| `DELETE` | `/api/obligations/:id` | Bearer | Soft-deletes or deletes recurring obligation. | 200, 404 |
| `POST` | `/api/obligations/:id/pay` | Bearer | Pay obligation: creates an expense record and debits designated account. | 200, 400, 404 |

### 2.6 Peer Debt & Split Expenses (`/api/splits`)
| Method | Endpoint | Auth | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/splits` | Bearer | List split expense records with status filtering (`PENDING`, `PARTIAL`, `SETTLED`). | 200, 500 |
| `GET` | `/api/splits/summary` | Bearer | Summary metrics: total lent, total settled, total pending receivables. | 200, 500 |
| `POST` | `/api/splits` | Bearer | Record new amount lent to a peer with borrower name and due date. | 201, 400 |
| `POST` | `/api/splits/:id/settle` | Bearer | Record partial or full debt settlement with optional account credit. | 200, 400, 404 |
| `DELETE` | `/api/splits/:id` | Bearer | Remove split expense record. | 200, 404 |

### 2.7 Investment Portfolio (`/api/stocks`, `/api/mutualfunds`, `/api/fds`, `/api/liquid`)
| Method | Endpoint | Auth | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/stocks` | Bearer | List stock holdings with real-time P&L virtual calculations. | 200, 500 |
| `POST` | `/api/stocks` | Bearer | Add stock holding (ticker, quantity, buy price, exchange). | 201, 400 |
| `PATCH` | `/api/stocks/:id/cmp` | Bearer | Update current market price for a stock holding. | 200, 400, 404 |
| `DELETE` | `/api/stocks/:id` | Bearer | Remove stock holding. | 200, 404 |
| `GET` | `/api/mutualfunds` | Bearer | List mutual fund holdings with NAV and P&L calculations. | 200, 500 |
| `POST` | `/api/mutualfunds` | Bearer | Record mutual fund investment (name, AMC, units, invested amount). | 201, 400 |
| `GET` | `/api/fds` | Bearer | List fixed deposits with compound interest maturity estimates. | 200, 500 |
| `POST` | `/api/fds` | Bearer | Record fixed deposit (bank, principal, interest rate %, tenure months). | 201, 400 |

### 2.8 Monthly Personal CA Report (`/api/reports/monthly`)
| Method | Endpoint | Auth | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/monthly` | Bearer | History list of generated reports with health scores and provisional flags. | 200, 500 |
| `GET` | `/api/reports/monthly/:year/:month` | Bearer | Full monthly CA audit report for given year & 1-based month. | 200, 400, 500 |
| `POST` | `/api/reports/monthly/generate` | Bearer | Explicitly trigger report recalculation / generation. | 200, 400, 500 |
| `GET` | `/api/reports/monthly/:year/:month/pdf`| Bearer | Download report as a styled binary PDF document (`application/pdf`). | 200, 400, 500 |
| `GET` | `/api/reports/monthly/:year/:month/csv`| Bearer | Download full report data as CSV spreadsheet (`text/csv`). | 200, 400, 500 |

### 2.9 Can I Afford It? Purchase Simulator (`/api/affordability`)
| Method | Endpoint | Auth | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/affordability/profile` | Bearer | Live baseline financial snapshot (income, needs, EMIs, liquid cash, buffer). | 200, 500 |
| `POST` | `/api/affordability/analyze` | Bearer | Execute deterministic purchase affordability simulation (Zero DB writes). | 200, 400, 500 |
| `POST` | `/api/affordability/save` | Bearer | Persist simulation result to history for future tracking. | 201, 400, 500 |
| `GET` | `/api/affordability/history` | Bearer | List saved simulations sorted by date descending. | 200, 500 |
| `DELETE` | `/api/affordability/:id` | Bearer | Delete saved purchase simulation record. | 200, 404, 500 |
| `POST` | `/api/affordability/:id/create-goal` | Bearer | Convert unaffordable simulation into an active savings goal. | 201, 400, 404 |

### 2.10 Financial Foundation & Rulebook (`/api`)
| Method | Endpoint | Auth | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/financial-foundation` | Bearer | Foundation milestones status, score (0-100), and onboarding state. | 200, 500 |
| `PATCH` | `/api/financial-foundation/milestones` | Bearer | Update emergency fund or health insurance completion flag. | 200, 400 |
| `POST` | `/api/financial-foundation/onboarding/complete`| Bearer | Complete first-login onboarding modal and save initial milestones. | 200, 400 |
| `POST` | `/api/financial-foundation/onboarding/dismiss` | Bearer | Dismiss onboarding modal (`status: "DISMISSED"`). | 200, 500 |
| `GET` | `/api/financial-rules` | Bearer | Static catalog of 28 financial rules across 5 categories with formulas. | 200 |

---

## 3. Identified API Inconsistencies & Technical Debt

1. **Inconsistent Response Envelope:**
   - Some endpoints return raw documents or arrays directly (`/api/expenses` returns `{ expenses, total, page }`, `/api/stocks` returns `[...]`).
   - Other endpoints wrap output in `{ success: true, data: ... }` (`/api/financial-foundation`, `/api/affordability/analyze`).
2. **Missing Rate Limiting:**
   - Critical routes like `/api/auth/login` and `/api/expenses/parse-sms` have no rate limiting, exposing them to brute force or parsing denial-of-service.
3. **HTTP Status Code Uniformity:**
   - Some validation errors return status `500` with the error message instead of explicit `400 Bad Request`.
