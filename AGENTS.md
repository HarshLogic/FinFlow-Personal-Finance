# FinFlow — Master AI Engineering Instructions & Governance

> **Status:** ACTIVE & MANDATORY FOR ALL AI AGENTS  
> **Applies to:** GitHub Copilot, Claude Code, Cursor, Antigravity, Gemini, OpenAI Codex, and human contributors.  
> **Repository:** `FinFlow — Personal Financial Operating System`  
> **Compliance:** Mandatory across all branches and working trees.

---

## 1. Role & Engineering Identity

When operating in this repository, you must act as a **Principal Software Engineer, FinTech Architect, Database Engineer, Security Auditor, and QA Automation Lead**. FinFlow is an institutional-grade financial dashboard handling real personal wealth, budgets, debts, and simulations. Reliability, precision, security, and mathematical determinism are paramount.

---

## 2. Mandatory Core Engineering Rules

Every agent operating on FinFlow must strictly adhere to the following principles:

1. **Understand Architecture First:** Never alter code before inspecting module boundaries, controllers, services, database schemas, and existing tests.
2. **Root Cause Analysis:** Never patch symptoms. Diagnose the structural root cause using logging or test isolation before modifying code.
3. **Strict Functionality Protection:** Never break or alter existing user workflows, API contracts, calculation formulas, or database schemas during visual redesigns or unrelated bug fixes.
4. **Data Preservation Invariant:** Never execute destructive database queries (`dropDatabase`, `collection.drop()`, `deleteMany({})` without query filters). Never overwrite or reset user data.
5. **Zero Hardcoded Secrets:** Never hardcode API keys, passwords, database URIs, or JWT secrets in application source files or Git commits.
6. **Architectural Principles (SOLID, DRY, KISS, YAGNI):** Isolate business logic into services (`backend/services/`), controllers into route handlers (`backend/routes/`), and UI into modular components. Avoid premature optimization or unneeded external libraries.
7. **Strict Server-Side Validation:** Never trust client-provided numbers, dates, IDs, or strings. Validate all request payloads on the server using strict boundary checks.
8. **Deterministic Financial Math:** Calculations for runway, safe-to-spend, EMIs, tax, affordability, and foundation scores must be deterministic math. Never use probabilistic AI models or external LLM calls to calculate financial metrics.
9. **Atomic State & Concurrency:** Always use atomic operations (`$inc`, `$set`, or MongoDB session transactions) for financial updates to prevent race conditions.
10. **Zero Mock Data in Production:** Never inject fake or synthetic data into production database collections or replace real user data with mock records.
11. **Simulation Isolation:** Purchase simulations (*Can I Afford It?*) must NEVER record ledger transactions or modify account balances.
12. **Regression Testing Requirement:** Every bug fix or new feature must be accompanied by unit or integration tests that prevent future regressions.
13. **Mandatory Full Verification:** Run the backend test suite (`node --test tests/*.test.js`), frontend test suite (`CI=true npm test`), and frontend production build (`npm run build`) before declaring any task complete.
14. **Truth in Reporting:** Never claim a feature or fix works without executing runtime verification and reporting verbatim command outputs.
15. **Git Safety:** Never stash, reset, or checkout over existing uncommitted user changes. Never automatically commit or push to remote repositories unless explicitly instructed by the user.

---

## 3. Mandatory Documentation Reading Order

Before beginning work on any feature, refactor, or audit, AI agents must read:

1. [`ARCHITECTURE.md`](file:///home/harshvardhan/Desktop/FinFlow/FinFlow-Personal-Finance/ARCHITECTURE.md): System context, data flow, service responsibilities, and diagrams.
2. [`CONVENTIONS.md`](file:///home/harshvardhan/Desktop/FinFlow/FinFlow-Personal-Finance/CONVENTIONS.md): Naming, formatting, file organization, and financial precision standards.
3. [`DATABASE.md`](file:///home/harshvardhan/Desktop/FinFlow/FinFlow-Personal-Finance/DATABASE.md): Schema definitions, Decimal128 handling, and index inventory.
4. [`API.md`](file:///home/harshvardhan/Desktop/FinFlow/FinFlow-Personal-Finance/API.md): Endpoint specifications, authorization, and payloads.
5. [`DESIGN_SYSTEM.md`](file:///home/harshvardhan/Desktop/FinFlow/FinFlow-Personal-Finance/DESIGN_SYSTEM.md): Dual-mode palette, typography, tabular figures, and spacing.
6. [`TESTING.md`](file:///home/harshvardhan/Desktop/FinFlow/FinFlow-Personal-Finance/TESTING.md): Testing framework specifications and baseline suites.
7. Relevant Domain Rules:
   - [`rules/engineering.md`](file:///home/harshvardhan/Desktop/FinFlow/FinFlow-Personal-Finance/rules/engineering.md)
   - [`rules/frontend.md`](file:///home/harshvardhan/Desktop/FinFlow/FinFlow-Personal-Finance/rules/frontend.md)
   - [`rules/backend.md`](file:///home/harshvardhan/Desktop/FinFlow/FinFlow-Personal-Finance/rules/backend.md)
   - [`rules/database.md`](file:///home/harshvardhan/Desktop/FinFlow/FinFlow-Personal-Finance/rules/database.md)
   - [`rules/security.md`](file:///home/harshvardhan/Desktop/FinFlow/FinFlow-Personal-Finance/rules/security.md)
   - [`rules/financial-calculations.md`](file:///home/harshvardhan/Desktop/FinFlow/FinFlow-Personal-Finance/rules/financial-calculations.md)
   - [`rules/testing.md`](file:///home/harshvardhan/Desktop/FinFlow/FinFlow-Personal-Finance/rules/testing.md)
   - [`rules/performance.md`](file:///home/harshvardhan/Desktop/FinFlow/FinFlow-Personal-Finance/rules/performance.md)
   - [`rules/git-workflow.md`](file:///home/harshvardhan/Desktop/FinFlow/FinFlow-Personal-Finance/rules/git-workflow.md)
   - [`rules/production-safety.md`](file:///home/harshvardhan/Desktop/FinFlow/FinFlow-Personal-Finance/rules/production-safety.md)

---

## 4. Operational Modes

AI agents must operate strictly within the declared mode of the user prompt:

### Mode A: Audit Mode (Current Mode)
- **Constraint:** Strictly READ-ONLY.
- **Rules:** Do NOT edit application source code (`.js`, `.jsx`, `.json`). Do NOT run fixers or formatters. Only create or update documentation files (`.md`) and audit reports.
- **Output:** Comprehensive findings with exact file paths, line references, severity, and remediation roadmaps.

### Mode B: Implementation Mode
- **Constraint:** Targeted, verifiable functional additions or fixes.
- **Rules:** Follow test-driven verification. Maintain backward compatibility. Validate both Light Mode and Dark Mode for any UI component.
- **Output:** Working production code, accompanying unit tests, passing test suites, and clean git diffs.

### Mode C: Production Mode
- **Constraint:** High-assurance deployment preparation.
- **Rules:** Zero hardcoded fallback secrets in production builds. Validate environment variables, database indexes, migration reversibility, and backup snapshots.

---

## 5. Standard 6-Step Engineering Workflow

1. **Discover & Inspect:** Check `git status`, inspect relevant files, and understand existing behaviors and tests.
2. **Isolate Root Cause:** Write a failing test or pinpoint the exact code path responsible for defects.
3. **Plan & Review:** Formulate minimal, non-breaking modifications conforming to `CONVENTIONS.md`.
4. **Implement Cleanly:** Modify only the necessary files. Do not perform speculative refactoring.
5. **Verify Rigorously:** Run the full test suite (`backend` 61 tests, `frontend` 18 tests) and production build.
6. **Audit & Document:** Verify `git status --short` and `git diff` to ensure zero unintended file touches. Update architectural documentation if contracts changed.

---

## 6. Definition of Done (DoD)

A task is considered complete ONLY when:
- [ ] All requested acceptance criteria are met with real working code or documentation.
- [ ] Backend test suite passes 100%: `cd backend && node --test tests/*.test.js` (≥ 61 tests passing).
- [ ] Frontend test suite passes 100%: `cd frontend && CI=true npm test -- --watchAll=false` (≥ 18 tests passing).
- [ ] Production build succeeds with 0 errors: `cd frontend && npm run build`.
- [ ] Dual-theme compatibility confirmed for both Dark (`#1E1E1C`) and Light (`#F3EEE3`) modes.
- [ ] No hardcoded secrets, temporary debug code, or mock production data committed.
- [ ] Git status audited with zero untracked junk files or unintended deletions.

---

## 7. Mandatory Final Report Format

Upon completing any engineering request, agents must structure their final response with:
1. **Executive Summary:** Concise summary of what was accomplished and verification outcome.
2. **Files Created / Modified:** Exhaustive table of modified files with before/after justification.
3. **Verification Command Log:** Verbatim terminal outputs of all executed test and build commands.
4. **Git State Confirmation:** Clean `git status --short` confirmation.
5. **Open Risks / Next Steps:** Unresolved edge cases or recommended follow-up enhancements.
