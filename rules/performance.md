# Performance & Scalability Standards

## 1. Database Query Optimization
- **Index All Queries:** Ensure every query is backed by an index starting with `{ userId: 1 }`.
- **Enforce Pagination:** Never return unbounded record sets. Enforce `.limit(50)` on transaction and report lists.
- **Selective Projections:** Use `.select("name type currentBalance")` to avoid fetching unused document fields.
- **Avoid N+1 Queries:** Use Mongoose `.populate()` or single `$in` queries instead of querying related collections inside loops.

---

## 2. Frontend Performance
- **Tabular Figures:** Always apply `font-variant-numeric: tabular-nums` to numbers to prevent browser layout reflows during state updates.
- **Memoization:** Wrap expensive sorting or filtering calculations in `useMemo`.
- **Debounced Sliders:** Debounce interactive range sliders (e.g. Wealth Projection) by 300-400ms before triggering backend API calls.
- **Bundle Footprint:** Avoid importing monolithic dependencies; use modular imports (e.g. `lucide-react` tree-shaken icons).

---

## 3. Prudent Optimization Principle
- Do not introduce distributed caching (Redis) or microservice decomposition until profiling on real user load justifies the operational complexity.
