# Technology Compliance & Stack Verification

**Project**: MomentLab  
**Partner Track**: ClickHouse  

## Approved Locked Technology Stack

| Layer | Approved Package / Resource | Compliance Justification |
|---|---|---|
| **AI Model Inference** | Gemini via Vertex AI (`google-genai`, `google-cloud-aiplatform`) | GCP managed inference within permitted Google Cloud stack. |
| **Agent Orchestration** | Google Agent Development Kit (`google-adk`) | Official Google Cloud agent framework. |
| **Database Partner** | Official `ClickHouse/mcp-clickhouse` server + ClickHouse Cloud / Local | Official MCP server distribution for ClickHouse partner track. |
| **FastAPI Backend Client** | `clickhouse-connect` | Non-AI high-throughput Python writer for audience playback event ingestion. |
| **Web Frontend** | React + Vite + TypeScript | Standard accessible SPA web framework. |
| **Icons & Design System** | Material Symbols + Inter Font | Screen 12 design tokens without external prohibited UI libraries. |
| **Cloud Infrastructure** | GCP Cloud Run, Secret Manager, Cloud Storage | Managed Google Cloud runtime. |

---

## Direct Dependency Allowlist

### Python (Backend / Agent)
- `google-adk`
- `google-genai`
- `google-cloud-aiplatform`
- `fastapi`
- `uvicorn`
- `pydantic`
- `clickhouse-connect`
- `httpx`
- `pytest`

### JavaScript / TypeScript (Frontend)
- `react`
- `react-dom`
- `react-router-dom`
- `lucide-react`
- `recharts` (or lightweight accessible D3/SVG timeline engine)
- `vite`
- `typescript`
- `@playwright/test`

---

## Direct Dependency Denylist (Strictly Prohibited)

- ❌ `openai`
- ❌ `@anthropic-ai/sdk`
- ❌ `langchain` / `langchain-community`
- ❌ `llama-index`
- ❌ `crewai`
- ❌ `autogen`
- ❌ `ollama`
- ❌ Custom/fake `mcp-server` imitations of ClickHouse

---

## End-to-End Architecture Trace

```text
[ Browser Client (React) ]
         │
         ▼ (HTTPS / WSS Event Stream)
[ FastAPI Cloud Run Service ]
         │
         ├─── High-Throughput Write ──► [ ClickHouse Database ]
         │
         ▼ (Google ADK MCP Tool Client)
[ Vertex AI Agent Engine / ADK Agent ]
         │
         ▼ (Stdio / SSE Protocol)
[ Official ClickHouse/mcp-clickhouse Server ]
         │
         ▼ (Read-Only SQL Queries)
[ ClickHouse Event Dataset ]
```

---

## Stack Verification Commands

```bash
# 1. Verify no prohibited AI packages exist in dependencies
grep -E "openai|anthropic|langchain|llamaindex|crewai|autogen|ollama" package.json requirements.txt

# 2. Verify official ClickHouse MCP distribution reference
grep "ClickHouse/mcp-clickhouse" docs/decisions.md backend/agents/mcp_client.py

# 3. Verify Vertex AI project credentials
gcloud config get-value project
```
