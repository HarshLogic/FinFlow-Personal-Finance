# Backend Engineering Standards

## 1. Controller & Route Responsibilities
- Route controllers (`backend/routes/`) must strictly handle:
  1. Input parameter extraction (`req.params`, `req.query`, `req.body`).
  2. Authentication verification via `requireAuth()`.
  3. Parameter validation (checking required fields, data types, and value boundaries).
  4. Delegating calculation or aggregation to services in `backend/services/`.
  5. Returning appropriate HTTP status codes and JSON payloads.

---

## 2. Business Logic Isolation
- Business logic, financial formulas, and complex data aggregations must live in `backend/services/`.
- Routes must never embed complex mathematical formulas or multi-step database mutations directly inside route handler closures.

---

## 3. Security & Resource Scoping
- **Single-Tenant Scoping:** Every query against user-owned data must explicitly include `{ userId: req.auth.userId }`.
- **Input Sanitization:** Check that numbers are positive where required (`min: 0`), strings are trimmed, and dates are valid `Date` instances.
- **Rate Limiting:** Protect authentication and parsing endpoints against brute-force attacks.

---

## 4. Idempotency & Concurrency
- Balance debits and credits must use atomic `$inc` updates rather than sequential read-modify-write patterns.
- Multi-document balance adjustments must be wrapped in MongoDB session transactions (`session.withTransaction()`).
- Endpoint mutations must handle duplicate requests gracefully (e.g. idempotent settlement actions).
