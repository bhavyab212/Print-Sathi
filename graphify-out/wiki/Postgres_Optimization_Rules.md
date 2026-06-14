# Postgres Optimization Rules

> 49 nodes · cohesion 0.07

## Key Concepts

- **Postgres Best Practices Compiled Rules** (20 connections) — `skills/postgres-best-practices/AGENTS.md`
- **Postgres Best Practices Skill** (10 connections) — `skills/postgres-best-practices/SKILL.md`
- **Use Connection Pooling for All Applications** (6 connections) — `skills/postgres-best-practices/rules/conn-pooling.md`
- **Use EXPLAIN ANALYZE to Diagnose Slow Queries** (5 connections) — `skills/postgres-best-practices/rules/monitor-explain-analyze.md`
- **Create Composite Indexes for Multi-Column Queries** (5 connections) — `skills/postgres-best-practices/rules/query-composite-indexes.md`
- **Use Covering Indexes to Avoid Table Lookups** (5 connections) — `skills/postgres-best-practices/rules/query-covering-indexes.md`
- **Concurrency & Locking Category** (5 connections) — `skills/postgres-best-practices/SKILL.md`
- **Connection Management Category** (5 connections) — `skills/postgres-best-practices/SKILL.md`
- **Data Access Patterns Category** (5 connections) — `skills/postgres-best-practices/SKILL.md`
- **Use tsvector for Full-Text Search** (4 connections) — `skills/postgres-best-practices/rules/advanced-full-text-search.md`
- **Index JSONB Columns for Efficient Querying** (4 connections) — `skills/postgres-best-practices/rules/advanced-jsonb-indexing.md`
- **Configure Idle Connection Timeouts** (4 connections) — `skills/postgres-best-practices/rules/conn-idle-timeout.md`
- **Set Appropriate Connection Limits** (4 connections) — `skills/postgres-best-practices/rules/conn-limits.md`
- **Use Prepared Statements Correctly with Pooling** (4 connections) — `skills/postgres-best-practices/rules/conn-prepared-statements.md`
- **Use Advisory Locks for Application-Level Locking** (4 connections) — `skills/postgres-best-practices/rules/lock-advisory.md`
- **Prevent Deadlocks with Consistent Lock Ordering** (4 connections) — `skills/postgres-best-practices/rules/lock-deadlock-prevention.md`
- **Keep Transactions Short to Reduce Lock Contention** (4 connections) — `skills/postgres-best-practices/rules/lock-short-transactions.md`
- **Use SKIP LOCKED for Non-Blocking Queue Processing** (4 connections) — `skills/postgres-best-practices/rules/lock-skip-locked.md`
- **Enable pg_stat_statements for Query Analysis** (4 connections) — `skills/postgres-best-practices/rules/monitor-pg-stat-statements.md`
- **Maintain Table Statistics with VACUUM and ANALYZE** (4 connections) — `skills/postgres-best-practices/rules/monitor-vacuum-analyze.md`
- **Monitoring & Diagnostics Category** (4 connections) — `skills/postgres-best-practices/SKILL.md`
- **Batch INSERT Statements for Bulk Data** (3 connections) — `skills/postgres-best-practices/rules/data-batch-inserts.md`
- **Eliminate N+1 Queries with Batch Loading** (3 connections) — `skills/postgres-best-practices/rules/data-n-plus-one.md`
- **Use Cursor-Based Pagination Instead of OFFSET** (3 connections) — `skills/postgres-best-practices/rules/data-pagination.md`
- **Use UPSERT for Insert-or-Update Operations** (3 connections) — `skills/postgres-best-practices/rules/data-upsert.md`
- *... and 24 more nodes in this community*

## Relationships

- No strong cross-community connections detected

## Source Files

- `skills/postgres-best-practices/AGENTS.md`
- `skills/postgres-best-practices/README.md`
- `skills/postgres-best-practices/SKILL.md`
- `skills/postgres-best-practices/rules/advanced-full-text-search.md`
- `skills/postgres-best-practices/rules/advanced-jsonb-indexing.md`
- `skills/postgres-best-practices/rules/conn-idle-timeout.md`
- `skills/postgres-best-practices/rules/conn-limits.md`
- `skills/postgres-best-practices/rules/conn-pooling.md`
- `skills/postgres-best-practices/rules/conn-prepared-statements.md`
- `skills/postgres-best-practices/rules/data-batch-inserts.md`
- `skills/postgres-best-practices/rules/data-n-plus-one.md`
- `skills/postgres-best-practices/rules/data-pagination.md`
- `skills/postgres-best-practices/rules/data-upsert.md`
- `skills/postgres-best-practices/rules/lock-advisory.md`
- `skills/postgres-best-practices/rules/lock-deadlock-prevention.md`
- `skills/postgres-best-practices/rules/lock-short-transactions.md`
- `skills/postgres-best-practices/rules/lock-skip-locked.md`
- `skills/postgres-best-practices/rules/monitor-explain-analyze.md`
- `skills/postgres-best-practices/rules/monitor-pg-stat-statements.md`
- `skills/postgres-best-practices/rules/monitor-vacuum-analyze.md`

## Audit Trail

- EXTRACTED: 134 (87%)
- INFERRED: 20 (13%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*