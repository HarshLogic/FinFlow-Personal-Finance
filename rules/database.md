# Database Engineering & Integrity Standards

## 1. Schema Design & Data Modeling
- Every collection storing user records must index `userId` as the primary tenant identifier.
- Foreign keys must use `Schema.Types.ObjectId` with an explicit `ref` attribute (e.g., `accountId`, `obligationId`, `splitExpenseId`).
- Use `{ timestamps: true }` on all Mongoose schemas to ensure automated tracking of `createdAt` and `updatedAt`.

---

## 2. Monetary Precision Standards
- Store all core financial balances, debts, obligations, and targets using `Schema.Types.Decimal128`.
- Apply `transformDecimal128` in schema `toJSON` options to ensure clean serialization to clients while retaining exact storage precision.
- Use `toDecimal128(num)` and `decimalToNumber(dec)` helpers for arithmetic operations.

---

## 3. Indexing & Query Optimization
- Queries that filter by `userId` and sort by `date` descending must have a compound index: `{ userId: 1, date: -1 }`.
- Natural unique constraints per user must be enforced via compound unique indexes (e.g. `{ userId: 1, name: 1 }` on `Account`).
- Avoid unindexed queries and unbounded list lookups. Always enforce `.limit(50)` on user queries.

---

## 4. Data Safety & Migrations
- Never perform destructive schema modifications that drop existing collections or wipe user records.
- Migrations must be written as additive, non-destructive scripts with backward-compatible defaults.
- Always verify backups before executing structural migrations.
