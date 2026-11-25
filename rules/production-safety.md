# Production Safety & Operational Safeguards

## 1. Inviolable Production Invariants
1. **Zero Data Deletion:** Never execute destructive commands (`dropDatabase`, `deleteMany({})`, `rm -rf`) on production servers or databases.
2. **No Production Seed Runs:** Never execute seed scripts (`seed.js`) against production databases.
3. **No Unverified Deployments:** Never trigger production deployments without running the full test suite and build verification.

---

## 2. Environment Verification
- In production, the backend must assert that `NODE_ENV === "production"`, `JWT_SECRET` is a secure non-fallback string, and `MONGO_URI` is a dedicated remote cluster.
- The server must terminate immediately (`process.exit(1)`) if startup invariants fail.

---

## 3. Backup & Rollback Protocol
- Verify automated daily database backups exist before applying schema changes.
- Ensure all frontend and backend releases are tagged and can be rolled back within 5 minutes of an incident.
- Monitor `/health` endpoint to detect database disconnection or container health failures.
