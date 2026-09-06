# MomentLab — Autonomous Audience-Experiment Agent

> **Turn consented, second-by-second audience behavior into the next controlled edit experiment.**  
> Built for the **Agentic Cinema: The Blockbuster Hackathon (ClickHouse Track)**.

🔗 **Live Hosted App**: [https://momentlab.ai](https://momentlab.ai)  
🌐 **Origin Cloud Run URL**: [https://momentlab-web-qa24oxtrrq-uc.a.run.app](https://momentlab-web-qa24oxtrrq-uc.a.run.app)  
🎥 **Demo Video**: Demo video: to be added before submission (YouTube, 3 min) | [Demo Script & Storyboard](docs/demo-script.md)

![Desktop Built](docs/images/momentlab-built.png)

---

## 💡 What MomentLab Is

MomentLab is an autonomous AI agent system for film editors and studio executives. It captures second-by-second consented audience telemetry across screening cuts, registers valid screening sessions into ClickHouse Cloud, ingests telemetry streams, detects engagement cliffs, and uses an autonomous Google ADK agent with Gemini 2.5 Pro to query ClickHouse via the official `ClickHouse/mcp-clickhouse` server protocol.

The agent investigates raw audience events, formulates evidence-backed edit hypotheses (e.g. *"MOVE REVEAL 6S EARLIER"*), attaches verifiable ClickHouse query provenance records, and gates A/B testing behind an authenticated human approval mechanism.

---

## 🎬 Master Loop

```text
consent → stream telemetry → detect → investigate with ClickHouse MCP → explain → propose → approve → test → evaluate
```

1. **Consent & Screening**: Screener enters valid token (e.g., `/screen/demo_token_123`), consent is registered and stored to ClickHouse (`screening_sessions`).
2. **Ingest & Store**: High-throughput playback stream (`/api/v1/events/playback`) validates prior session consent before storing events to ClickHouse Cloud (`audience_events`). Retention curves are server-derived.
3. **Detect & Investigate**: Server-side detector identifies retention cliffs; Google ADK agent queries ClickHouse Cloud via official `ClickHouse/mcp-clickhouse` MCP server.
4. **Hypothesize**: Gemini 2.5 Pro (via Vertex AI) explains evidence and proposes a falsifiable edit hypothesis (`MOVE REVEAL 6S EARLIER`).
5. **Human Approval Gate**: Mandatory server-signed human approval (authenticated via `REVIEWER_TOKENS`) before initiating Cut B screening.
6. **Evaluate**: Statistical evaluation of Variant B vs Control A (+18.2% engagement lift).

---

## ⚡ Runtime Infrastructure (Google Cloud & ClickHouse)

MomentLab executes real analytical queries against ClickHouse Cloud at runtime using the following core architecture:

* **Google Agent Development Kit (`google-adk`)**: Autonomous agent orchestration engine driving tool usage and multi-step investigation loops.
* **Vertex AI / Gemini 2.5 Pro (`gemini-2.5-pro`)**: Native model inference evaluating audience events and generating structured hypothesis specifications.
* **Official ClickHouse MCP Server (`ClickHouse/mcp-clickhouse`)**: Stdio-based Model Context Protocol transport executing real SQL queries against ClickHouse Cloud.
* **ClickHouse Cloud Database**: High-performance analytical column store hosting `momentlab.screening_sessions`, `momentlab.audience_events`, `momentlab.reaction_events`, and `system.query_log`.
* **GCP Cloud Run**: Containerized deployment hosting the FastAPI backend and React Vite single-page application (`--min-instances=1` configured for judging week to eliminate cold starts; should be reverted to `0` post-judging to control cost).

---

## 🔒 Technology Stack & Hackathon Compliance

| Layer | Approved Technology |
|---|---|
| **AI Model Inference** | Gemini via Vertex AI (`google-genai`, `gemini-2.5-pro`) |
| **Agent Framework** | Google Agent Development Kit (`google-adk`) |
| **Database Partner** | Official `ClickHouse/mcp-clickhouse` server + ClickHouse Cloud |
| **Backend Service** | Python FastAPI + Pydantic |
| **Frontend Web SPA** | React + Vite + TypeScript |
| **Hosting & Cloud** | GCP Cloud Run, Secret Manager, Artifact Registry |

---

## 💻 Local Setup & Run Instructions

This repository contains everything needed to run MomentLab locally or deploy to GCP Cloud Run.

### Prerequisites
- Python 3.10+ (recommended: Python 3.14 venv)
- Node.js 18+ & npm
- `uvx` (for running `mcp-clickhouse`)

### 1. Installation & Environment

```bash
# Clone repository
git clone https://github.com/mgraves-centrix/momentlab.git
cd momentlab

# Setup Python virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

# Install Frontend dependencies
npm install
```

### 2. Configure Environment Variables

Create `.env` in the repository root:

```env
GCP_PROJECT_ID=momentlab-504305
GCP_LOCATION=us-central1
GOOGLE_CLOUD_PROJECT=momentlab-504305
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_GENAI_USE_VERTEXAI=true

CLICKHOUSE_HOST=nk8zetjq1w.us-east1.gcp.clickhouse.cloud
CLICKHOUSE_PORT=8443
CLICKHOUSE_USER=momentlab_writer
CLICKHOUSE_PASSWORD=<YOUR_CLICKHOUSE_PASSWORD>
CLICKHOUSE_DATABASE=momentlab
CLICKHOUSE_SECURE=true

CLICKHOUSE_ADMIN_USER=default
CLICKHOUSE_ADMIN_PASSWORD=<YOUR_CLICKHOUSE_ADMIN_PASSWORD>

CLICKHOUSE_WRITER_USER=momentlab_writer
CLICKHOUSE_WRITER_PASSWORD=<YOUR_CLICKHOUSE_WRITER_PASSWORD>

CLICKHOUSE_MCP_USER=momentlab_mcp_reader
CLICKHOUSE_MCP_PASSWORD=<YOUR_CLICKHOUSE_MCP_PASSWORD>

# Reviewer authentication bearer tokens (comma-separated list for gating approval/reset APIs)
# Can be generated locally via `openssl rand -hex 16`
REVIEWER_TOKENS=rev_demo_token_123,rev_p11_token_456
```

#### Note on `REVIEWER_TOKENS`
The backend enforces Bearer token authentication on approval and reset endpoints (`POST /api/v1/projects/{pid}/experiments/{eid}/hypotheses/{hid}/approve` and `POST /api/v1/telemetry/reset`). Set `REVIEWER_TOKENS` as a comma-separated string in local `.env` or in GCP Secret Manager / Cloud Run environment variables.

#### ClickHouse Cloud Operational Requirements
* **Service Status**: The ClickHouse Cloud instance must be RUNNING (a stopped/idled service returns TLS EOF during handshakes and causes the app to report `UNHEALTHY`).
* **Required Grants**: The four SQL grants (`GRANT SELECT ON system.query_log` and `GRANT REMOTE ON *.*` to `momentlab_writer` and `momentlab_mcp_reader`) must be applied via `python backend/scripts/grant_query_log.py`. Without these grants, system query logging and multi-replica cluster resolution fail silently.
* **Materialized View Rebuild & Repair Path**: ClickHouse Materialized Views (`retention_by_second_mv` and `reaction_anomalies_mv`) trigger on `INSERT` operations. Deletes in `audience_events` or `reaction_events` leave stale rows in aggregated tables (`retention_by_second_aggregated` and `reaction_anomalies_aggregated`). To repair aggregates after raw data modifications:
  ```bash
  python backend/scripts/rebuild_materialized_views.py
  ```
  This script truncates aggregated tables, re-populates them directly from raw source events, and updates persisted detector state.

### 3. Deployment & Seeding Sequence

When deploying or seeding a new environment, execute commands in the following required order:

```bash
# 1. Build and deploy container image to GCP Cloud Run
./deploy.sh

# 2. Grant ClickHouse permissions required for evidence query log inspection and multi-replica provenance resolution
# (Required: Grants system.query_log SELECT and REMOTE permissions to momentlab_writer and momentlab_mcp_reader)
python backend/scripts/grant_query_log.py

# 3. Seed ClickHouse tables with baseline schema and screening sessions
python backend/scripts/seed_clickhouse.py

# 4. Seed Firestore database with baseline experiment and hypothesis documents
python backend/scripts/seed_firestore.py
```

### 4. Run Locally

```bash
# Start local demo environment (Backend FastAPI on port 8000 + Frontend Vite on port 3000)
make demo

# Or run backend directly:
PYTHONPATH=. uvicorn backend.main:app --reload --port 8000

# Or run frontend directly:
npm run dev
```

### 5. Run Verification Suite

```bash
# Run backend pytest suite
PYTHONPATH=. .venv/bin/pytest backend/tests -q

# Run end-to-end Playwright suite (prerequisite: build first)
npm run build
npm run test:e2e      # or: npx playwright test

# Run full system verification (build, lint, test)
make verify
```

---

## 🚀 Hackathon Commands (Makefile)

We have provided a comprehensive `Makefile` to quickly exercise all paths:

```bash
# Start local demo environment (frontend + backend)
make demo

# Build, Lint, AI-Compliance Check
make submission-audit

# Build UI and Verify
make ui-verify

# Run System Verification Tests
make verify

# Reset Database State
make reset-demo

# Deploy to Cloud Run
make deploy

# Smoke test deployment and seed data
make smoke
```

---

## 📱 Mobile Experience

MomentLab includes a fully responsive mobile workflow for reviewing findings and approving tests on the go.

<div style="display: flex; gap: 10px;">
  <img src="docs/images/momentlab-mobile-finding.png" width="30%" alt="Mobile Finding">
  <img src="docs/images/momentlab-mobile-evidence.png" width="30%" alt="Mobile Evidence">
  <img src="docs/images/momentlab-mobile-test.png" width="30%" alt="Mobile Test">
</div>

---

## 🛡️ Truthfulness, Synthetic Media & Privacy Disclosures

- **Synthetic Footage & Simulated Audience Data**: In compliance with hackathon rules, all screening footage and audience responses in default test configurations are synthetic assets and deterministic simulated behavioral fixtures. All AI-generated media is explicitly labeled `SYNTHETIC`.
- **Zero Biometric Tracking**: MomentLab enforces a strict policy against collecting, inferring, or storing biometric, facial, gaze, voice-stress, or emotion-recognition data. All telemetry consists strictly of consented media timecodes, play/pause states, and explicit button reactions.
- **Backend-Mediated Firestore Access**: Direct client access to Firestore is disabled; all database operations are secured and routed exclusively through service account credentials within the backend API.
- **Google Veo Status**: Generative video generation via Google Veo calls the Vertex AI API (`veo-2.0-generate-001`). If active Veo quota is not yet enabled on the GCP project, the endpoint returns an honest `BLOCKED` status detailing the exact Model Garden allowlist step.


---

## 📄 Key Documentation

- [Hackathon Submission & Features](docs/submission.md)
- [Judging Criteria Proof](docs/judge-proof.md)
- [3-Minute Video Script](docs/demo-script.md)
- [Visual QA Scorecard (99/100)](docs/visual-qa.md)
- [Hackathon Compliance Matrix](docs/compliance-matrix.md)
- [Technology Compliance & Denylist Lock](docs/technology-compliance.md)
- [Architecture Decision Records (ADR-001)](docs/decisions.md)

---

## ⚖️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
