# GCP Deployment & Runtime Verification Proof

**Project**: MomentLab  
**Target GCP Project**: `momentlab-504305` ("MomentLab", ACTIVE)  
**Project Owner Account**: `guarded.ops@gmail.com`  
**GCP Region**: `us-central1`  
**Audit Date**: 2026-08-23  

---

## Hosted GCP Services & Infrastructure Status

| Resource | Type | Configured Identity / Details | Verification Status | Notes / Live State |
|---|---|---|---|---|
| **Cloud Run Web & API Service** | GCP Cloud Run | `momentlab-web` (Port 8080) | **READY** | Deployed at `https://momentlab-web-qa24oxtrrq-uc.a.run.app` (Revision built 2026-08-03; predates current branch) |
| **Artifact Registry** | Container Registry | `us-central1-docker.pkg.dev/momentlab-504305/momentlab-repo` | **BUILT** | Contains 3 `momentlab-web` container image digests; none tagged `latest` |
| **ClickHouse Database & MCP** | Managed Cloud DB / MCP | `nk8zetjq1w.us-east1.gcp.clickhouse.cloud:8443` (DB: `momentlab`) | **VERIFIED** | Live ClickHouse Cloud instance with 30,360 rows verified; official MCP client integration |
| **Secret Manager** | Secret Manager | `clickhouse-writer-credentials`, `clickhouse-mcp-credentials` | **NOT PROVISIONED** | `gcloud secrets list` returns 0 secrets in `momentlab-504305`; runtime relies on local `.env` |
| **Vertex AI Agent Engine** | Reasoning Engines | `projects/momentlab-504305/locations/us-central1/reasoningEngines` | **NOT PROVISIONED** | Vertex AI `reasoningEngines` endpoint returns `{}`; agent operates via local ADK engine |
| **Cloud Firestore** | Document Database | `momentlab-504305` | **NOT ENABLED** | Firestore is not enabled in `momentlab-504305`; application uses Firestore emulator (`localhost:8080`) |
| **Vertex AI Veo Generative Video** | Foundation Models | `veo-3.1-fast-generate-001` (`us-central1`) | **QUOTA GATED** | Model catalog discovery verified in `us-central1`; generation blocked pending quota allowlist approval |

---

## Known Deployment Gaps

1. **Stale Cloud Run Revision**: The deployed Cloud Run service `momentlab-web` is running an image built on 2026-08-03 which predates the `momentlab-repair` branch and its bug fixes. Redeployment is pending.
2. **Firestore Not Enabled**: Firestore is not provisioned in project `momentlab-504305`. Local development, seeding (`backend/scripts/seed_firestore.py`), and test suites run against the local Firestore emulator (`localhost:8080`).
3. **Secret Manager Empty**: 0 secrets exist in Google Secret Manager for project `momentlab-504305`. Production secret migration is pending.
4. **Vertex AI Reasoning Engine Unprovisioned**: No reasoning engine is deployed under `projects/momentlab-504305/locations/us-central1/reasoningEngines`.
5. **Veo Quota Approval Pending**: Veo models are catalog-accessible in `us-central1`, but video generation is quota-gated until quota allowlist approval is granted by Google Cloud.

---

## Pre-Release Secret & Provenance Scan

- **Git Secret Scan**: **PENDING** — A complete secret scan (`gitleaks` / `git secrets`) is pending and must be executed and confirmed clean before making the repository public.
- **Prohibited SDK Scan**: **PASSED** — 0 non-Google LLMs (OpenAI, Anthropic, Ollama, HuggingFace, Mistral) and 0 non-Google agent frameworks (LangChain, LlamaIndex, CrewAI, AutoGen) detected in codebase. Pure Gemini via Vertex AI and Google ADK.
- **Media Provenance**: **VERIFIED** — All media assets and simulation fixtures are original, synthetic, or licensed under Creative Commons. 0 third-party copyrighted assets used.
