# GCP Deployment & Runtime Verification Proof

**Project**: MomentLab  
**Target GCP Project**: `momentlab-504305`  
**GCP Region**: `us-central1`  
**Deployment Date**: 2026-08-04  

## Hosted GCP Services

| Resource | Type | Configured Identity / Details | Verification Status |
|---|---|---|---|
| **Cloud Run Web & API Service** | GCP Cloud Run | `momentlab-web` (Port 8080) | **READY** |
| **Vertex AI Agent Engine** | Agent Builder / Engine | `projects/momentlab-504305/locations/us-central1/agents/momentlab-adk` | **READY** |
| **Secret Manager** | Secret Manager | `clickhouse-writer-credentials`, `clickhouse-mcp-credentials` | **ENCRYPTED** |
| **ClickHouse MCP Transport** | Stdio / SSE | Official `ClickHouse/mcp-clickhouse` distribution | **VERIFIED** |
| **Artifact Registry** | Container Registry | `us-central1-docker.pkg.dev/momentlab-504305/momentlab-repo/momentlab-web:latest` | **BUILT** |

---

## Pre-Release Secret & Provenance Scan

- **Git Secret Scan**: 0 unencrypted API keys or database passwords found in repository code (`git secrets` / `gitleaks` clean).
- **Prohibited SDK Scan**: 0 non-Google LLM or non-Google agent framework imports detected.
- **Media Provenance**: All media assets and fixtures are original, synthetic, or licensed under creative commons. 0 third-party copyrighted clips used.
