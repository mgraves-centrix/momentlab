# Hackathon Compliance Matrix — MomentLab

**Project**: MomentLab  
**Track**: ClickHouse Track (Agentic Cinema: The Blockbuster Hackathon)  
**Last Updated**: 2026-08-04  

This document tracks strict adherence to all contest regulations, technology locks, security policies, and privacy guidelines.

| Rule / Gate | Official Source URL | Implementation Files | Automated Verification | Runtime Proof | UI Proof | Demo Timestamp | Status |
|---|---|---|---|---|---|---|---|
| Newly created contest app | Devpost Contest Rules | `package.json`, `GEMINI.md` | Initial commit date audit | Git history verification | App header build version | 00:05 | PASS |
| Gemini via Vertex AI only | Vertex AI Documentation | `backend/agents/mcp_client.py` | `pytest` dependency audit | Vertex AI API trace log | Agent model footer (`Gemini 2.5 Pro`) | 01:15 | PASS |
| Google ADK agent framework | Google ADK Repository | `backend/agents/mcp_client.py` | AST check for `google-adk` import | ADK runner execution log | MCP activity trail panel | 01:30 | PASS |
| Official ClickHouse MCP | ClickHouse/mcp-clickhouse | `backend/agents/mcp_client.py`, `backend/services/clickhouse.py` | Package lock check for official package | Sanitized MCP tool call log | Sanitized tool trail panel | 01:45 | PASS |
| GCP Product & Hosting | Google Cloud Docs | `Dockerfile`, `deploy.sh` | Cloud Run build verification | GCP Cloud Run URL | Live hosted domain | 02:30 | PASS |
| No non-Google AI LLMs | Denylist Policy | `backend/`, `src/` | Grep scan for `openai`, `anthropic`, `ollama` | Zero non-Google network requests | N/A | N/A | PASS |
| No non-Google Agent Frameworks | Denylist Policy | `backend/`, `src/` | Grep scan for `langchain`, `llamaindex`, `crewai` | Clean dependency tree | N/A | N/A | PASS |
| No Direct AI Studio Key | Denylist Policy | `backend/main.py`, `backend/agents/mcp_client.py` | Environment key audit for `GEMINI_API_KEY` | GCP Project ID auth | N/A | N/A | PASS |
| No Biometric / Emotion Tracking | Privacy Policy | `src/pages/ConsentPage.tsx`, `src/components/MediaPlayer.tsx` | Code review for webcam/mic APIs | Zero browser media device access | Explicit privacy badge on player | 00:40 | PASS |
| Explicit Labeling (`SIMULATED`/`SYNTHETIC`) | Truthful State Policy | `src/components/HypothesisCard.tsx`, `src/pages/EditHypothesisPage.tsx` | Component unit test for label presence | DOM inspection | Visible `SIMULATED` badge on card | 01:50 | PASS |
| Mandatory Approval Gate | Security Policy | `src/components/ApprovalGate.tsx`, `backend/routers/hypotheses.py` | E2E approval route verification | Server-signed approval audit record | `APPROVE & LAUNCH` button gate | 02:00 | PASS |
| Responsive Dedicated Mobile Nav | UI Contract | `src/components/MobileBottomNav.tsx` | Viewport snapshot (390px) | Mobile viewport layout test | 4-item bottom nav (`Finding`, `Evidence`, `Test`, `More`) | 02:15 | PASS |
