# MomentLab — Autonomous Audience-Experiment Agent

> **Turn consented, second-by-second audience behavior into the next controlled edit experiment.**
> Built for the **Agentic Cinema: The Blockbuster Hackathon (ClickHouse Track)**.

---

## 🎬 Master Loop

```text
detect → investigate with ClickHouse MCP → explain → propose → approve → test → evaluate
```

1. **Capture**: Consented, second-by-second playback reactions across scene cuts.
2. **Ingest & Store**: High-throughput stream into ClickHouse database via FastAPI.
3. **Detect & Investigate**: Detect retention cliffs; Google ADK agent queries ClickHouse via official `ClickHouse/mcp-clickhouse`.
4. **Hypothesize**: Gemini (via Vertex AI) explains evidence and proposes a falsifiable edit hypothesis (`MOVE REVEAL 6S EARLIER`).
5. **Human Approval Gate**: Mandatory server-signed human approval before initiating Cut B screening.
6. **Evaluate**: Statistical evaluation of Variant B vs Control A (+18.2% engagement lift).

---

## 🔒 Technology Stack & Hackathon Compliance

| Layer | Approved Technology |
|---|---|
| **AI Model Inference** | Gemini via Vertex AI (`google-genai`) |
| **Agent Framework** | Google Agent Development Kit (`google-adk`) |
| **Database Partner** | Official `ClickHouse/mcp-clickhouse` server + ClickHouse Cloud |
| **Backend Service** | Python FastAPI + Pydantic |
| **Frontend Web SPA** | React + Vite + TypeScript |
| **Hosting & Cloud** | GCP Cloud Run, Secret Manager, Cloud Build |

---

## 🚀 Quickstart & Verification

### 1. Web Frontend
```bash
# Install frontend dependencies
npm install

# Run local development server
npm run dev

# Compile TypeScript and build production bundle
npm run build
```

### 2. Python Backend & Integration Tests
```bash
# Set up virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

# Run backend integration tests (events, ClickHouse MCP, ADK agent)
PYTHONPATH=. .venv/bin/pytest backend/tests/
```

### 3. End-to-End Playwright Tests
```bash
# Run Playwright E2E suite
npx playwright test
```

---

## 📄 Key Documentation

- [UI Implementation Contract](UI-IMPLEMENTATION-CONTRACT.md)
- [Hackathon Compliance Matrix](docs/compliance-matrix.md)
- [Technology Compliance & Denylist Lock](docs/technology-compliance.md)
- [Architecture Decision Records (ADR-001)](docs/decisions.md)
- [Visual QA Scorecard (100/100)](docs/visual-qa.md)
- [WCAG 2.2 AA Accessibility Audit](docs/accessibility.md)
- [Ground Truth Evaluation Report](docs/evaluation-report.md)
- [GCP Deployment Proof](docs/deploy-verification.md)
- [3-Minute Video Script](docs/submission-script.md)
