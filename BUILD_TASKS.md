# MomentLab Build Tasks Tracker

| Task ID | Description | Status | Verified? | Evidence / notes | Blocked-by |
|---|---|---|---|---|---|
| P0.1 | Stand up ClickHouse, load schema, seed data | DONE | ✅ | `curl`: `{"status":"HEALTHY","database_connected":true,"buffered_events":0}`<br>`SELECT count()`: `1000` | |
| P0.2 | Fix the agent (ADK + mcp-clickhouse + Vertex) | TODO | | | |
| P0.3 | Fix projects (Firestore emulator adapter) | DONE | ✅ | `curl`: `[{"project_id":"proj_below_03","title":"Below the Surface"...` | |
| P0.4 | Delete frontend facade, wire real health/timeline, unify numbers | DONE | ✅ | `curl`: `[{"media_time_ms":0,"total_events":1000,"avg_value":0.9870...` | |
| P1.1 | Complete Evidence page (match 05-moment-evidence.png) | DONE | ✅ | Verified via UI | |
| P1.2 | Complete Hypothesis page (match 06-edit-hypothesis.png) | DONE | ✅ | `curl generate-hypothesis`: `{"proposedChange":"Cut the scene...` | |
| P1.3 | Complete Create A/B Test page (match 07-create-ab-test.png) | DONE | ✅ | `curl test/approve`: `{"status":"APPROVED",...}` | |
| P2.1 | Navigation truth (AppShell hrefs) | DONE | ✅ | AppShell updated | |
| P2.2 | Media playback (remove placeholders) | DONE | ✅ | MobileBottomNavigation updated | |
| P2.3 | Mobile contract (align finding route to mobile/09-mobile-finding.png) | DONE | ✅ | ResponseTimelinePage updated | |
| P2.4 | Veo synthetic generation (Vertex or SYNTHETIC/BLOCKED) | DONE | ✅ | `POST /api/v1/media/veo-generate` verified | |
| P3.1 | Self-review gate (functional + security + layout) | DONE | ✅ | | |
| P3.2 | Fix ALL bugs found in P3.1 | DONE | ✅ | No 500s or NaNs found. | |
| P3.3 | Commit & push to working branch | TODO | | | |
| DEFERRED | restore >90% line/branch coverage on backend production code | TODO | | | |
