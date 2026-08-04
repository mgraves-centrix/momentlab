# MomentLab UI implementation contract

This document is the release contract for implementing MomentLab as a live, responsive application. It converts the approved visual references into deterministic routes, components, states, and acceptance tests. It is not an invitation to redesign the product.

## Authority and conflict resolution

When two sources differ, apply this order without silently blending them:

1. Security, privacy, hackathon compliance, authorization, and accessibility requirements in `MOMENTLAB-BUILD-PROMPT.md`.
2. This UI implementation contract.
3. The dedicated PNG for the exact route and viewport being implemented.
4. `momentlab-reference-pack/system/12-design-system-board.png` and `momentlab-reference-pack/system/13-state-reference-board.png`.
5. Composite images, `design/reference-originals/`, and the local Idea Lab as directional context.

Record any unresolved material conflict in `docs/decisions.md` before implementation. Never invent a compromise. Dedicated route references are authoritative for content presence, order, and navigation at their viewport.

## Canonical routes

The same route model applies at every breakpoint. The base experiment route redirects to `finding` while preserving query state.

| Route | Reference | Required purpose |
|---|---|---|
| `/projects` | `momentlab-reference-pack/desktop/01-project-dashboard.png` | Project and screening overview |
| `/screen/:screeningToken` before consent | `momentlab-reference-pack/desktop/02-screening-consent.png` | Consent and privacy state |
| `/screen/:screeningToken` after consent | `momentlab-reference-pack/desktop/03-audience-player.png` | Instrumented audience player state |
| `/projects/:projectId/experiments/:experimentId/finding` | `momentlab-reference-pack/desktop/04-response-timeline.png`, `momentlab-reference-pack/mobile/09-mobile-finding.png` | Primary finding and synchronized response timeline |
| `/projects/:projectId/experiments/:experimentId/evidence` | `momentlab-reference-pack/desktop/05-moment-evidence.png`, `momentlab-reference-pack/mobile/10-mobile-evidence.png` | Evidence, uncertainty, and MCP activity |
| `/projects/:projectId/experiments/:experimentId/hypothesis` | `momentlab-reference-pack/desktop/06-edit-hypothesis.png` | Full hypothesis review and decision |
| `/projects/:projectId/experiments/:experimentId/test` | `momentlab-reference-pack/desktop/07-create-ab-test.png`, `momentlab-reference-pack/mobile/11-mobile-test.png` | Approval-gated experiment setup |
| `/projects/:projectId/experiments/:experimentId/results` | `momentlab-reference-pack/desktop/08-experiment-results.png` | Experiment outcome and statistical evidence |
| `/projects/:projectId/experiments/:experimentId/more` | no dedicated image; compose only from existing navigation primitives | Mobile access to Results, Project, Help, and authorized Demo controls |
| `/admin/demo` | state board and existing primitives | Protected deterministic demo controls and health |

The experiment base URL must redirect to `/finding`. Cohort, window, `media_time_ms`, and selected evidence belong in URL query state where shareability matters. Transient player and agent-stream state may live in the shared route store but must survive sibling-route navigation.

## Mobile navigation decision

Use the four-item bottom navigation shown in the dedicated mobile references, labeled exactly `Finding`, `Evidence`, `Test`, and `More`. This supersedes any earlier navigation description.

- `Finding`, `Evidence`, and `Test` navigate to their canonical sibling routes.
- `More` navigates to `/more` and exposes text links to Results, Project dashboard, Help, and Demo controls only when the user is authorized and demo mode is enabled.
- The active item is violet and exposes `aria-current="page"`.
- Back gestures, browser history, deep links, refresh, safe-area insets, and 200% text zoom must work.
- The navigation is sticky, at least 72 CSS px including the safe area, and never covers the page action or privacy footer.

The mobile Finding route must match `momentlab-reference-pack/mobile/09-mobile-finding.png`. It does **not** add the desktop four-metric row above the chart. Do not add UI that is absent from its dedicated reference merely because it appears in a composite or desktop screen.

## Visual system

Use one restrained editorial-workstation system across every route:

```css
:root {
  --canvas: #080b0e;
  --surface-1: #0c1115;
  --surface-2: #11171c;
  --surface-3: #171e24;
  --border: #202a31;
  --text: #f1f3f2;
  --muted: #8d979f;
  --violet: #8b5cf6;
  --violet-soft: #c4a7ff;
  --lime: #b7e33d;
  --coral: #ff6652;
  --success: #58c94b;
  --warning: #f2b84b;
  --danger: #ff6652;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

- Use a locally bundled, licensed compact sans-serif family with tabular numerals and a condensed label face. Prefer `Inter` plus `Inter Tight`; document licenses and use system fallbacks.
- Use Material Symbols as the single icon language. No emoji, mixed icon packs, decorative illustration, glassmorphism, glow, or gradients.
- Spacing scale: 4, 8, 12, 16, 24, and 32 px. Default panel padding is 12 px desktop and 16 px mobile.
- Desktop global header: 60 px. Mobile header: 56 px. Minimum touch target: 44 × 44 px.
- Body: 12–14 px; labels: 10–11 px uppercase with tracking; key metrics: 26–32 px; brand: 24–28 px.
- Desktop finding workspace at 1568 × 1000: approximately `31% / 46% / 23%` with 8–12 px gutters. At 900–1279 px use a two-column layout and accessible details rail. Below 900 px use the dedicated mobile route composition.
- Use visible `:focus-visible`, semantic landmarks, reduced motion, sufficient contrast, and textual chart alternatives. Never encode state by color alone.

## Reusable component contracts

Implement these as real shared components, not route-specific lookalikes:

| Component | Contract and required states |
|---|---|
| `AppShell` | Desktop header, responsive content frame, mobile header/nav; loading and route-error boundaries |
| `ProjectSelector` | Current project, keyboard listbox behavior, loading/empty/unauthorized |
| `MediaPlayer` | 16:9 media, transport, timecode, captions, scrub synchronization, unavailable-media fallback |
| `SceneFilmstrip` | Selected frame and playhead; pointer, touch, and keyboard scrubbing; loading/empty |
| `CohortSelector` | `All`, `18–24`, `25–34`; sample size and disabled insufficient cohorts |
| `TimeWindowSelector` | `10S`, `30S`, `1M`; URL-backed state and accessible selected value |
| `ResponseTimeline` | Cohort series, uncertainty, crosshair, coral anomaly, textual table/summary, loading/empty/insufficient/error |
| `AnomalyCallout` | `RESPONSE CLIFF`, `−28%`, `00:33–00:41`; observation label and selected state |
| `EvidenceRecord` | Evidence ID, source query-run ID, sample, effect, uncertainty, timestamp, expand/collapse |
| `ConfidenceMeter` | Calibrated confidence label and basis; never imply causal certainty |
| `HypothesisCard` | Proposed change, rationale, evidence links, limitations, `SIMULATED` forecast label |
| `McpActivityPanel` | Actual connection health and sanitized server telemetry; connecting/connected/disconnected/error/retry |
| `CutComparison` | Control and variant timelines, synchronized preview, accessible change summary |
| `ApprovalGate` | Authenticated reviewer, explicit consent control, server-confirmed status, pending/approved/denied/error |
| `ExperimentOutcome` | Supported/rejected/inconclusive result, interval, guardrails, simulated label |
| `MobileBottomNavigation` | Four canonical items, safe-area support, current route, notification-free stable layout |
| `StatePanel` | Consistent loading, empty, blocked, error, retry, and next-safe-action treatment |

All demo values come from typed deterministic fixtures or APIs. Components must not embed Northlight values as scattered presentation constants. Observation, inference, forecast, and outcome must each use an explicit visible label.

## Required product states

Every applicable route needs a deterministic Storybook story or test route for:

| State | Required truthful behavior |
|---|---|
| Loading | Skeleton preserves final geometry; status is announced without trapping focus |
| No projects/screenings | Explains the empty state and offers the authorized next action |
| Insufficient sample | Shows observed count and threshold; returns `INSUFFICIENT_SAMPLE`; no conclusion |
| MCP connecting | Neutral connecting state; never display `CONNECTED` early |
| MCP disconnected/tool error | Last-known data is labeled stale, retry is available, and no fabricated trace appears |
| Investigating | Real streamed progress with cancellable/recoverable behavior |
| Hypothesis ready | Evidence links resolve and uncertainty/limitations are visible |
| Awaiting approval | Launch disabled; authorized reviewer and consequence are explicit |
| Test running | Current allocation/status shown; results are not predicted as facts |
| Supported/rejected/inconclusive | Each outcome has distinct copy, evidence, uncertainty, and next safe action |
| Permission denied | No protected data leaks; safe navigation remains available |
| Offline/stale cache | Staleness timestamp is visible; mutations are disabled or safely queued |

## Interaction and data rules

- Player, filmstrip, response timeline, anomaly selection, and evidence focus share canonical `media_time_ms`.
- Chart hover, focus, and touch expose time, cohort, sample size, value, and uncertainty.
- Cohort and window changes update real query results and URL state.
- Selecting `00:37` highlights matching frames, evidence, query activity, and rationale.
- `CREATE A/B TEST` creates a draft only. `APPROVE & LAUNCH` requires an authenticated, server-recorded approval and an idempotent launch request.
- MCP UI consumes authenticated server-sent events. It never exposes credentials, sensitive parameters, or unrestricted SQL.
- Forecast and seeded result numbers display `SIMULATED`. Generated media displays `SYNTHETIC` where viewers encounter it.

## Visual QA scorecard

Create `docs/visual-qa.md` and score every canonical route at each required viewport. A release candidate passes only at **99/100 or higher overall**, with **no category below 98%**, no severity-1 discrepancy, no missing route/state, no overlap or clipping, and zero serious or critical automated accessibility violations.

| Category | Weight | Evidence |
|---|---:|---|
| Information architecture and layout | 25 | Reference overlay/side-by-side, panel proportions, content order |
| Typography and spacing | 15 | Font, scale, density, rhythm, truncation and zoom review |
| Color, iconography, and components | 15 | Token and reusable-component comparison |
| Data and evidence semantics | 15 | Labels, values, provenance, uncertainty, truthful state |
| Interaction and state behavior | 15 | Playwright flows, keyboard/touch, approval and failure cases |
| Responsive design and accessibility | 15 | Viewport matrix, axe, contrast, zoom, reduced motion |

Required screenshot viewports:

- Desktop/tablet: 1568 × 1000, 1280 × 800, and 1024 × 768.
- Mobile: every applicable route at 390 × 844 and 430 × 932.

Compare each route to its dedicated file under `momentlab-reference-pack`, not to a nonexistent or generic image. Save final built screenshots under `docs/images/` using route-specific names.

## Release budgets

- WCAG 2.2 AA basics and zero axe serious/critical violations on canonical routes.
- No horizontal page overflow at required viewports or 200% text zoom.
- Lighthouse targets on the production-like demo profile: performance ≥90 and accessibility ≥95; document hardware/network assumptions and actual results.
- Core Web Vitals goals: LCP ≤2.5 s, CLS ≤0.1, and INP ≤200 ms on the documented profile.
- Timeline scrub input-to-visible-update p95 ≤50 ms with the seeded dataset.
- Every asynchronous failure offers a truthful recovery or next-safe action.

## Acceptance artifacts

Before declaring UI complete, produce:

- `design/reference-review.md` with every opened reference and date.
- `docs/route-reference-checklist.md` with route, viewport, components, states, tests, and screenshot.
- `docs/visual-qa.md` with the scored matrix, discrepancies, fixes, and final evidence.
- `docs/accessibility.md` with keyboard, screen-reader, contrast, zoom, reduced-motion, and axe results.
- Route-specific verified PNGs in `docs/images/`.
- Playwright visual and interaction tests that can be rerun from a documented command.
