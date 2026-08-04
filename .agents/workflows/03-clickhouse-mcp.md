# Workflow 03 — ClickHouse and visible MCP

Goal: make ClickHouse MCP visibly indispensable to the finding.

1. Implement bounded aggregate queries and evidence/query-run records with cohort suppression.
2. Run the official `ClickHouse/mcp-clickhouse` server using a read-only identity and allowlisted tools.
3. Connect it through Google ADK with authenticated server-side transport, timeouts, row limits, cancellation, and redaction.
4. Stream real sanitized tool telemetry to `McpActivityPanel`; never expose credentials or sensitive parameters.
5. Prove the seeded `00:37` anomaly is retrieved from ClickHouse and evidence IDs resolve to stored records.
6. Test prompt/SQL misuse, overbroad queries, disconnect/retry, timeouts, empty results, and cross-project access.

Exit gate: a captured end-to-end run shows ADK invoking official ClickHouse MCP, returning real rows, generating valid evidence lineage, and driving the live finding UI.
