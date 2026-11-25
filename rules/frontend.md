# Frontend Engineering Standards

## 1. Component Responsibilities
- **Page Components (`src/pages/`):** Coordinate high-level page data loading, state orchestration, sub-widget layout, and navigation triggers.
- **Presentation Widgets (`src/components/`):** Pure or focused presentation units that receive props (`C`, `data`, `onAction`) and render specific financial data without direct route orchestration.
- **Atom Components (`src/shared.jsx`):** Reusable design-system atoms (`MetricCard`, `Pill`, `SectionTitle`, `Spinner`, `ErrorBox`) that guarantee UI consistency across the entire app.

---

## 2. State Management & Re-renders
- Keep state local where possible. Avoid unnecessary global stores.
- Use `useCallback` for event handlers passed down to child components.
- Use `useMemo` for derived financial metrics (e.g., portfolio totals, allocation sums) to prevent recalculation on every render.
- Ensure dependency arrays in `useEffect` and `useCallback` are exhaustive and accurate.

---

## 3. Network & Form Handling
- **API Interceptors:** All HTTP traffic must route through the `src/api.js` Axios singleton, which injects `Authorization: Bearer <token>`.
- **Loading States:** Every asynchronous button or container must display a `<Spinner />` or skeleton loader while fetching or submitting.
- **Error States:** Display inline, accessible `<ErrorBox />` components with retry actions for failed network requests.
- **Empty States:** When records are empty, show informative guidance with a direct call-to-action to record the first transaction or goal.

---

## 4. Accessibility & UI Invariants
- **Dual-Theme Support:** Every newly added or modified component must be validated in both Dark Mode (`C.bg = #1E1E1C`) and Light Mode (`C.bg = #F3EEE3`).
- **Contrast Rule:** Button text on `C.accent` must ALWAYS be `#FFFFFF` to satisfy WCAG AA contrast (≥ 4.5:1).
- **Tabular Numerals:** Always apply `font-variant-numeric: tabular-nums` to financial prices, balances, interest rates, and tables to prevent horizontal layout shift.
- **Focus Outlines:** Maintain visible `:focus-visible` styling on all interactive controls.
