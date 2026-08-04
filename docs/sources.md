# Primary Sources & Official Verification Log

**Verification Date**: 2026-08-04  
**Project**: MomentLab (Agentic Cinema: The Blockbuster Hackathon — ClickHouse Track)

## Primary Specification & Policy Sources

| ID | Document / Source Name | Target URL / Path | Access Date | Decision / Implementation Impact |
|---|---|---|---|---|
| SRC-01 | Hackathon Submission Rules | https://devpost.com (Agentic Cinema Rules) | 2026-08-04 | Locked stack to Gemini via Vertex AI, Google ADK, official ClickHouse MCP, Google Cloud. |
| SRC-02 | Google Cloud Vertex AI Docs | https://cloud.google.com/vertex-ai/docs | 2026-08-04 | Required model SDK `google-genai` / `google-cloud-aiplatform`. Blocked direct AI Studio `GEMINI_API_KEY`. |
| SRC-03 | Google Agent Development Kit | https://github.com/google-gemini/adk-python | 2026-08-04 | Required `google-adk` framework for agent orchestration & MCP client calling. |
| SRC-04 | Official ClickHouse MCP Server | https://github.com/ClickHouse/mcp-clickhouse | 2026-08-04 | Pinned official `ClickHouse/mcp-clickhouse` distribution for runtime database tool calls. |
| SRC-05 | ClickHouse Python Driver | https://github.com/ClickHouse/clickhouse-connect | 2026-08-04 | Standard non-AI write client for high-throughput audience event ingestion in FastAPI. |
| SRC-06 | WCAG 2.2 AA Guidelines | https://www.w3.org/TR/WCAG22/ | 2026-08-04 | Min 44x44px touch targets, `:focus-visible` styling, textual chart alternatives, contrast requirements. |

## Local Governing Source Hierarchy

1. `MOMENTLAB-BUILD-PROMPT.md` (Product Specification & Hackathon Rules)
2. `UI-IMPLEMENTATION-CONTRACT.md` (Responsive UI, Routes, Components, Visual QA Budget)
3. Dedicated Route PNGs in `momentlab-reference-pack/`
4. `system/12-design-system-board.png` and `system/13-state-reference-board.png`
5. `.agents/rules/` policy files (`00-momentlab-governing-contract.md`, `10-google-technology-policy.md`, `20-ui-fidelity-and-accessibility.md`, `30-verification-and-truthfulness.md`, `40-antigravity-ide-denylist.md`)
