# MomentLab Build Tasks Tracker

| Task ID | Description | Status | Verified? | Evidence / notes | Blocked-by |
|---|---|---|---|---|---|
| C-1 | Leftover Test Projects Purge | DONE | ✅ | Deleted test projects from Firestore store. `GET /api/v1/projects` returns exactly 3 canonical projects (`proj_northlight_01`, `proj_echoes_02`, `proj_below_03`) with Northlight first. Added authenticated `DELETE /api/v1/projects/{id}` and self-cleaning unit tests. | |
| C-2 | Primary Demo & Frame Thumbnails | DONE | ✅ | Generated 11 distinct cinematic frame PNGs (`frame_00_33.png` to `frame_00_41.png`, `cut_a_control.png`, `cut_b_variant.png`). Replaced all repeated static stills in `CutComparison.tsx`, `MomentEvidencePage.tsx`, and `ExperimentResultsPage.tsx`. Media player duration clamped to 61s to prevent timecode rendering past duration. | |
| C-3 | Google Veo Status & Model Discovery | DONE | ✅ | Queried live Vertex AI model catalog in `us-central1` (128 models found including `veo-2.0-generate-001`). Verified endpoint returns structured, honest `BLOCKED` status detailing the exact Model Garden allowlist step and `gcloud services enable` command. | |
| C-4 | Admin Demo Health & Telemetry Reset | DONE | ✅ | Built live `/health` diagnostics card with on-demand refresh and ClickHouse status, plus authenticated `POST /api/v1/telemetry/reset` endpoint with confirmation checkbox and blast-radius copy. Verified re-seeding 61 timeline buckets and 30,358 events. | |
| C-5 | Remote Branch Push | DONE | ✅ | Pushed commits `6b5d997` and `2bb4d77` to `origin/momentlab-repair`. Verified `origin/main` untouched. | |
| C-6 | Truthfulness Polish & Stale Comments | DONE | ✅ | Replaced stale `google.antigravity` framework comments in `backend/agent/adk_runner.py` and compliance scripts with real `google.adk`. Added truthfulness disclosures in `README.md` for synthetic footage, simulated audience telemetry, and zero biometric tracking. | |

---

## Verifier Final Exit Check Output

```bash
R=/Users/mattgraves/Development/momentlab; B=http://localhost:8000

=== EXIT CHECK: PROJECTS COUNT ===
projects 3

=== EXIT CHECK: HEALTH ===
{"status":"HEALTHY","database_connected":true,"buffered_events":0}

=== EXIT CHECK: VEO STATUS ===
{"status":"BLOCKED","reason":"Vertex AI Veo video generation requires active Veo quota on project 'guarded-ops' in region us-central1. Error: 404 NOT_FOUND. {'error': {'code': 404, 'message': 'Publisher model `projects/guarded-ops/locations/us-central1/publishers/google/models/veo-2.0-generate-001` was not found or your project does not have access to it.'}}. Action required: enable model in Vertex AI Model Garden (https://console.cloud.google.com/vertex-ai/model-garden?project=guarded-ops) and run 'gcloud services enable aiplatform.googleapis.com --project guarded-ops'.","media_type":"SYNTHETIC","model":"veo-2.0-generate-001"}

=== EXIT CHECK: GOOGLE.ANTIGRAVITY OCCURRENCES ===
0

=== EXIT CHECK: NORTHLIGHT_THUMB OCCURRENCES IN CUTCOMPARISON ===
0

=== EXIT CHECK: GIT LOG MOMENTLAB-REPAIR VS MAIN ===
2bb4d77 feat(cleanup): complete items C-1 through C-6 with verified audits and controls
6b5d997 feat: complete punch list items PL-1 to PL-6 and F-1 to F-10 with verified audit

=== EXIT CHECK: PYTEST ===
15 passed, 8 warnings in 2.22s

=== EXIT CHECK: SUBMISSION AUDIT ===
Running AI Compliance Check...
AI Compliance Check PASSED. All conditions met.
```
