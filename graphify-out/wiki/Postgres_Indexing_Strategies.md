# Postgres Indexing Strategies

> 17 nodes · cohesion 0.14

## Key Concepts

- **Choose the Right Index Type for Your Data** (8 connections) — `skills/postgres-best-practices/rules/query-index-types.md`
- **Add Indexes on WHERE and JOIN Columns** (6 connections) — `skills/postgres-best-practices/rules/query-missing-indexes.md`
- **Use Partial Indexes for Filtered Queries** (5 connections) — `skills/postgres-best-practices/rules/query-partial-indexes.md`
- **Index Foreign Key Columns** (4 connections) — `skills/postgres-best-practices/rules/schema-foreign-key-indexes.md`
- **Query Performance Rule Category** (4 connections) — `skills/postgres-best-practices/rules/_sections.md`
- **Foreign Key Side Indexing** (2 connections) — `skills/postgres-best-practices/rules/query-missing-indexes.md`
- **RLS Filter Column Indexing** (2 connections) — `skills/postgres-best-practices/rules/security-rls-performance.md`
- **BRIN Index Pattern for Large Time-Series** (1 connections) — `skills/postgres-best-practices/rules/query-index-types.md`
- **B-tree Index Pattern** (1 connections) — `skills/postgres-best-practices/rules/query-index-types.md`
- **GIN Index Pattern for JSONB/Arrays** (1 connections) — `skills/postgres-best-practices/rules/query-index-types.md`
- **Hash Index Pattern for Equality-Only** (1 connections) — `skills/postgres-best-practices/rules/query-index-types.md`
- **Rationale: Choosing Right Index Type for Query Patterns** (1 connections) — `skills/postgres-best-practices/rules/query-index-types.md`
- **Sequential Scan Anti-Pattern** (1 connections) — `skills/postgres-best-practices/rules/query-missing-indexes.md`
- **Pending Status Filter Optimization** (1 connections) — `skills/postgres-best-practices/rules/query-partial-indexes.md`
- **Soft-delete Filter Optimization** (1 connections) — `skills/postgres-best-practices/rules/query-partial-indexes.md`
- **ON DELETE CASCADE Lock and Scan Mitigation** (1 connections) — `skills/postgres-best-practices/rules/schema-foreign-key-indexes.md`
- **pg_constraint query for Missing FK Indexes** (1 connections) — `skills/postgres-best-practices/rules/schema-foreign-key-indexes.md`

## Relationships

- No strong cross-community connections detected

## Source Files

- `skills/postgres-best-practices/rules/_sections.md`
- `skills/postgres-best-practices/rules/query-index-types.md`
- `skills/postgres-best-practices/rules/query-missing-indexes.md`
- `skills/postgres-best-practices/rules/query-partial-indexes.md`
- `skills/postgres-best-practices/rules/schema-foreign-key-indexes.md`
- `skills/postgres-best-practices/rules/security-rls-performance.md`

## Audit Trail

- EXTRACTED: 24 (59%)
- INFERRED: 17 (41%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*