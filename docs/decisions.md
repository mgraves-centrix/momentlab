# Architecture Decision Records (ADRs)

## ADR-001: System Boundaries, Identity, ClickHouse Ingestion, MCP Transport, and Local Adapters

**Date**: 2026-08-04  
**Status**: APPROVED  
**Context**: MomentLab requires a high-throughput audience event ingestion pipeline, a read-only MCP interface for Gemini agent investigations via Google ADK, strict human approval gates, and a reliable dev fallback strategy.

---

### Decisions

#### 1. System Boundaries & Communication Contracts
- **Frontend SPA (React + TypeScript)** communicates with **Backend API (FastAPI on Cloud Run)** via REST and Server-Sent Events (SSE).
- Frontend never communicates directly with ClickHouse or Vertex AI; all database queries and agent reasoning pass through backend API contracts.
- Player timecode, active cohort, selected scene range, and hypothesis state are synchronized via URL parameters for full shareability (`/finding?t=37&cohort=all&window=30s`).

#### 2. Identity & Approval Authority Model
- User authentication uses **Firebase Auth / Google Cloud Identity Platform**.
- Human reviewer authorization is enforced on the server for `APPROVE & LAUNCH` operations.
- Experiment launch requires a signed approval record stored in the database (`reviewer_id`, `timestamp`, `hypothesis_id`, `experiment_id`, `consent_hash`).

#### 3. Dual ClickHouse Database Identities
- **Ingestion Role (`momentlab_writer`)**: Write-only credentials used exclusively by FastAPI backend to stream validated second-by-second audience events (`INSERT INTO audience_events ...`).
- **Agent Analysis Role (`momentlab_mcp_reader`)**: Read-only credentials used exclusively by official `ClickHouse/mcp-clickhouse` server. Banned from mutating queries (`DROP`, `ALTER`, `TRUNCATE`, `INSERT`).

#### 4. MCP Transport & Telemetry Trail
- Agent uses **Google ADK MCP client** connecting to `ClickHouse/mcp-clickhouse` via Stdio (local/container) or SSE.
- Tool executions emit sanitized telemetry events (`tool_name`, `duration_ms`, `row_count`, `query_purpose`, `timestamp`) streamed to the frontend `McpActivityPanel`.
- Raw SQL parameters and database credentials are excluded from client-facing telemetry logs.

#### 5. Vertex AI & Agent Engine Deployment
- Gemini model inference uses `google-genai` / `google-cloud-aiplatform` with Vertex AI in Google Cloud Project `momentlab-504305`.
- Production agent deploys to Vertex AI Agent Engine.

#### 6. Development Adapters & Truthful Labels
- In local development without live ClickHouse Cloud credentials, a contract-faithful SQLite/In-Memory ClickHouse adapter serves seeded Northlight fixtures.
- The UI MUST prominently display `CONNECTED` only when connected to a live MCP stream, `SIMULATED` on generated forecasts, and `SYNTHETIC` on simulated video cuts.
