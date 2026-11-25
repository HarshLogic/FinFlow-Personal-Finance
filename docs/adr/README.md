# Architecture Decision Records (ADR)

## 1. Overview
An Architecture Decision Record (ADR) captures significant architectural choices made in the FinFlow Personal Financial Operating System, along with their context, trade-offs, and consequences.

---

## 2. ADR Specification Template

All future architectural changes must be documented using the following template:

```markdown
# ADR-XXX: [Short Descriptive Title]

- **Date:** YYYY-MM-DD
- **Status:** [PROPOSED | ACCEPTED | REJECTED | DEPRECATED | SUPERSEDED by ADR-YYY]
- **Deciders:** [Engineering Roles / Authors]

### 1. Context & Problem Statement
[Describe the technical context, user need, or problem that necessitates an architectural decision.]

### 2. Considered Alternatives
- **Alternative 1:** [Description, pros, cons]
- **Alternative 2:** [Description, pros, cons]

### 3. Decision Outcome
[Chosen option and rationale: "We will adopt X because Y..."]

### 4. Consequences
- **Positive:** [Anticipated architectural benefits]
- **Negative / Trade-offs:** [Costs, operational overhead, limitations]

### 5. Domain Considerations
- **Security Considerations:** [Impact on authentication, authorization, or attack surface]
- **Financial Integrity Considerations:** [Impact on calculation accuracy, precision, or idempotency]
- **Rollback Strategy:** [Steps required to revert this decision if defects arise]
```

---

## 3. Historical Architectural Decisions (Supported by Repository Evidence)

### ADR-001: Deterministic Mathematical Modeling for Financial Engines
- **Date:** 2026-11-25
- **Status:** ACCEPTED
- **Context:** The application required purchase simulation (*Can I Afford It?*), runway modeling, debt-to-income calculations, and safe-to-spend forecasting.
- **Decision:** Implement pure, deterministic mathematical formulas in Node.js services (`affordabilityEngine.js`, `budgetEngine.js`, `emiCalculator.js`). Prohibit probabilistic LLM models or paid third-party financial APIs for calculating numbers.
- **Consequences:** 100% reproducible results, zero external API costs, testable in milliseconds with zero network latency.

### ADR-002: Dual-Mode Custom Design System with Tabular Numerals
- **Date:** 2026-11-25
- **Status:** ACCEPTED
- **Context:** The dashboard required institutional-grade presentation, low-contrast eye fatigue reduction, and support for both dark and light environments without layout jumping.
- **Decision:** Establish centralized theme tokens (`shared.jsx` and `style.css`) supporting Charcoal/Sand (`#1E1E1C` / `#D8CBB3`) in dark mode and Cream/Ink Black (`#F3EEE3` / `#111111`) in light mode, with mandatory `font-variant-numeric: tabular-nums` across all numbers.
- **Consequences:** WCAG AA compliant contrast, zero layout shift during real-time re-renders, and unified visual identity across all views.

### ADR-003: Single-Tenant Query Scoping via `req.auth.userId`
- **Date:** 2026-11-25
- **Status:** ACCEPTED
- **Context:** All financial ledgers, accounts, portfolios, and reports are private to the individual user.
- **Decision:** Every database query in route controllers and services must explicitly filter by `{ userId: req.auth.userId }` extracted from verified JWT tokens.
- **Consequences:** Prevents horizontal privilege escalation and cross-user data leakage at the query layer.

### ADR-004: Decimal128 Storage for Financial Balances
- **Date:** 2026-11-25
- **Status:** ACCEPTED
- **Context:** Standard JavaScript numbers use binary floating-point (IEEE 754), which can introduce rounding inaccuracies in financial balances.
- **Decision:** Use Mongoose `Schema.Types.Decimal128` for `Account`, `SplitExpense`, and `RecurringObligation` models, combined with serialization helpers (`transformDecimal128`).
- **Consequences:** Exact monetary precision in stored balances; requires explicit conversions (`toDecimal128`, `decimalToNumber`) when performing arithmetic in Node.js.

---

## 4. Proposed Future Architectural Decisions

### ADR-005: Atomic `$inc` Updates and Multi-Document Transactions
- **Date:** 2026-11-25
- **Status:** PROPOSED
- **Context:** Account balance updates currently execute via read-modify-write, creating race conditions under concurrent requests. Multi-collection mutations lack atomicity.
- **Decision:** Migrate account debits to atomic `$inc` operations and wrap linked operations (e.g. creating an expense and debiting an account) in MongoDB session transactions (`session.withTransaction()`).
- **Anticipated Consequences:** Complete protection against race conditions and orphaned ledger entries during server failures.

### ADR-006: Distributed Advisory Locking for Scheduled Cron Tasks
- **Date:** 2026-11-25
- **Status:** PROPOSED
- **Context:** In multi-instance production deployments, the in-process cron scheduler in `schedular.js` will execute duplicate daily price syncs and monthly report generation.
- **Decision:** Implement a MongoDB-backed lease lock (`CronLock` collection with TTL) before executing scheduled jobs, ensuring only a single instance runs any given scheduled task.
- **Anticipated Consequences:** Safe horizontal scaling of backend API instances with zero duplicated cron jobs.
