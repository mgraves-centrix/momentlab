# Route Reference & Component Contract Checklist

**Project**: MomentLab  
**Authority**: `UI-IMPLEMENTATION-CONTRACT.md` and `momentlab-reference-pack/`

## Canonical Routes & Viewport Verification Matrix

| Route | Desktop Reference (1568px) | Mobile Reference (390px) | Component Dependencies | State Coverage | Visual QA Status |
|---|---|---|---|---|---|
| `/projects` | `desktop/01-project-dashboard.png` | Standard responsive stack | `AppShell`, `ProjectSelector` | Loading, Empty, Populated | PENDING |
| `/screen/:screeningToken` (consent) | `desktop/02-screening-consent.png` | Standard responsive stack | `AppShell`, Consent form | Pre-consent, Accepted, Denied | PENDING |
| `/screen/:screeningToken` (player) | `desktop/03-audience-player.png` | Standard responsive stack | `MediaPlayer`, Reaction scrubber | Playing, Paused, Event capture | PENDING |
| `/projects/:projectId/experiments/:experimentId/finding` | `desktop/04-response-timeline.png` | `mobile/09-mobile-finding.png` | `SceneFilmstrip`, `ResponseTimeline`, `AnomalyCallout` | Timeline scrub, Anomaly focus, Insufficient sample | PENDING |
| `/projects/:projectId/experiments/:experimentId/evidence` | `desktop/05-moment-evidence.png` | `mobile/10-mobile-evidence.png` | `EvidenceRecord`, `McpActivityPanel` | Connecting, Connected, Disconnected stream | PENDING |
| `/projects/:projectId/experiments/:experimentId/hypothesis` | `desktop/06-edit-hypothesis.png` | Standard responsive stack | `HypothesisCard`, `ConfidenceMeter` | Proposal ready, Simulated label | PENDING |
| `/projects/:projectId/experiments/:experimentId/test` | `desktop/07-create-ab-test.png` | `mobile/11-mobile-test.png` | `ApprovalGate`, `CutComparison` | Pending approval, Approved, Launched | PENDING |
| `/projects/:projectId/experiments/:experimentId/results` | `desktop/08-experiment-results.png` | Via `/more` route | `ExperimentOutcome` | Supported, Rejected, Inconclusive | PENDING |
| `/projects/:projectId/experiments/:experimentId/more` | N/A (Desktop shows full nav) | Dedicated mobile route | Mobile drawer / primitives | Nav links, Auth demo controls | PENDING |
| `/admin/demo` | State board primitives | Standard responsive stack | `StatePanel`, Demo controls | 12 state board fixtures | PENDING |

---

## Responsive Viewport Contract Rules

1. **Desktop viewports**: Tested at `1568 × 1000`, `1280 × 800`, and `1024 × 768`.
2. **Mobile viewports**: Tested at `390 × 844` and `430 × 932`.
3. **Mobile Finding View (`mobile/09-mobile-finding.png`)**: Single column layout. **Does NOT include top 4-metric row**.
4. **Mobile Bottom Navigation**: 4 sticky items (`Finding`, `Evidence`, `Test`, `More`). Touch target size ≥ 44 × 44 px. Active item `#8b5cf6`.
