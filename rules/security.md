# Security & Authorization Standards

## 1. OWASP Security Principles
- **A01: Broken Access Control:** Every resource access must verify ownership using `req.auth.userId`. Never accept an untrusted `userId` from request body or query params to locate records.
- **A02: Cryptographic Failures:** Passwords must be hashed using `bcryptjs` with a cost factor of at least 10. In production, JWT secrets must be 256-bit cryptographically secure strings.
- **A03: Injection:** Use Mongoose parameterized queries. For CSV export generators, prefix cells starting with `=, +, -, @` with a single quote (`'`) to prevent Formula Injection.
- **A05: Security Misconfiguration:** Restrict CORS allowed origins to specific trusted domains. Never use wildcard origins (`*`) with `credentials: true`. Overly permissive regex like `origin.endsWith(".vercel.app")` must be tightened to specific deployment URLs.

---

## 2. Authentication & Token Management
- Issue JSON Web Tokens with a 7-day expiration (`{ expiresIn: "7d" }`).
- Reject tokens that fail verification immediately with `401 Unauthorized`.
- Protect the `/api/auth/me` and password change endpoints with strict password confirmation.

---

## 3. Secrets & Sensitive Data Handling
- Never log user passwords, JWT tokens, bank credentials, or financial account secrets in server logs.
- Redact sensitive data in error responses; never dump full database stack traces or connection strings to client responses.
- In production, assert that `JWT_SECRET` and `MONGO_URI` are properly configured before the server begins listening.
