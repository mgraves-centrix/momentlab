# MomentLab Acceptance Checklist

## 1. Compliance Items (§3)
- [ ] Official Google ADK used (replace `google.antigravity`)
- [ ] Official `ClickHouse/mcp-clickhouse` registered (with required fields e.g., `name`)
- [ ] Vertex AI used for model inference (no raw API key path)
- [ ] `make submission-audit` passes

## 2. Definition of Done Items (§5)
- [x] P3 self-review gate is clean (zero open verified defects)
- [x] Verified work committed (one logical change per commit, no co-author lines) and pushed to a working branch
- [ ] `/health` returns `database_connected: true`
- [ ] `/api/v1/projects` returns 3 real projects; New Project modal persists a 4th
- [ ] `generate-hypothesis` returns 200 with real SQL in `evidence[]` (or printed BLOCKED)
- [ ] Evidence screen matches reference 05 with real data
- [ ] Hypothesis screen matches reference 06 with real data
- [ ] Test screen matches reference 07 with real data
- [ ] `APPROVE & LAUNCH` performs real recorded approval (200) gated behind consent
- [ ] Identical headline numbers on all experiment screens
- [ ] No console 500s / NaN path errors
- [ ] No nav item points to placeholder; no media placeholder where reference shows content
- [x] `BUILD_TASKS.md` + `docs/build-checklist.md` are current and have pasted verification evidence

## 3. Route × Viewport Screenshot Matrix
- [ ] Evidence page (Desktop 1568x1000)
- [ ] Hypothesis page (Desktop 1568x1000)
- [ ] Test page (Desktop 1568x1000)
- [ ] Finding page (Mobile 390x844)
- [ ] Finding page (Mobile 430x932)
