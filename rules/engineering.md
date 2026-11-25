# Engineering Principles & Design Standards

## 1. Core Principles

### 1.1 SOLID Principles in FinFlow
- **Single Responsibility Principle (SRP):** Each module, service, and component must have one well-defined responsibility.
  - Route controllers handle HTTP request parsing and response delivery.
  - Services execute deterministic domain math and business logic.
  - Mongoose models manage schema validation, indexing, and data casting.
- **Open/Closed Principle (OCP):** Financial engines (e.g., `recommendationEngine.js`, `financialRulesData.js`) should be open for extension through configurable rule objects without modifying the evaluation core.
- **Liskov Substitution & Interface Segregation:** Shared helper interfaces must provide minimal, purpose-built contracts.
- **Dependency Inversion Principle (DIP):** High-level services must depend on abstractions and data interfaces, not direct transport or HTTP globals.

### 1.2 DRY (Don't Repeat Yourself)
- Centralize duplicated business logic into shared services (`backend/services/`).
- Centralize duplicated UI elements (e.g. `MetricCard`, `Pill`, `Spinner`, `ErrorBox`) into `src/shared.jsx`.
- Centralize formatting helpers (`fmt()`, `toDecimal128()`, `decimalToNumber()`).

### 1.3 KISS (Keep It Simple, Stupid)
- Write readable, explicit JavaScript/React code.
- Avoid abstract meta-programming, custom query compilers, or convoluted state machines where simple condition matrices suffice.

### 1.4 YAGNI (You Aren't Gonna Need It)
- Do NOT introduce microservices, Redis caching, message brokers, or graph databases until verified performance profiling demonstrates necessity.
- Do NOT add unused utility libraries or npm packages when native standard library features (`Intl.NumberFormat`, `node:test`, `Math`) exist.

---

## 2. Root Cause Analysis
- Before applying any bug fix, pinpoint the fundamental failure point using unit tests or isolated reproduction scripts.
- Never wrap failing code in speculative `try ... catch` blocks that swallow errors silently.
- Fix the core flaw in data modeling or formula logic, not just the symptom.

---

## 3. Backward Compatibility & Code Reviews
- Ensure database schema updates provide sensible defaults for historical records.
- Preserve existing API response keys when extending endpoints.
- Code reviews must verify:
  1. Zero functional regressions.
  2. Complete unit test coverage for new or modified logic.
  3. Strict adherence to `DESIGN_SYSTEM.md` and `CONVENTIONS.md`.
