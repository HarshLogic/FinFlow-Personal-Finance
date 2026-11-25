# Git Workflow & Source Control Standards

## 1. Branch Strategy
- **`main`:** Production-ready code. All commits in `main` must pass full verification.
- **Feature Branches:** `feat/feature-name`
- **Bugfix Branches:** `fix/issue-description`
- **Audit Branches:** `audit/topic-name`

---

## 2. Commit Message Conventions
FinFlow follows the Conventional Commits specification:
- `feat: <description>` — New user-facing feature.
- `fix: <description>` — Bug fix.
- `docs: <description>` — Documentation creation or update.
- `style: <description>` — Formatting, visual design system tokens (no logic changes).
- `refactor: <description>` — Code restructuring without feature changes.
- `test: <description>` — Adding or updating test suites.
- `chore: <description>` — Maintenance, build scripts, package updates.

---

## 3. Git Safety Rules
- **Protect Uncommitted Changes:** Always inspect `git status --short` before starting work. Never stash, reset, or checkout over user files.
- **Zero Secrets in Commits:** Never commit `.env` files, production credentials, or private API keys.
- **No Unauthorized Commits/Pushes:** Automated AI agents must NEVER commit or push code to remote repositories without explicit user instruction.
