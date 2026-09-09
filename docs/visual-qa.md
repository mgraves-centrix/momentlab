# Visual QA Report

## Overview
This document records the visual QA pass on the MomentLab interface and the provenance of
the screenshots in `docs/images/`.

## Method
Screenshots are captured by `tests/e2e/visual_qa.spec.ts` (Playwright) against the deployed
application at `https://momentlab.ai`, at the viewports listed below. The ratings are a
design review by the build team, not an automated metric. The accessibility row reflects the
audited scope recorded in `docs/judge-proof.md`, not a conformance test. Note that the
application scrolls inside an inner container rather than the document, so `fullPage`
captures come out at viewport height; each image shows the top of its screen rather than the
whole scrollable page.

## Score Matrix
| Category | Desktop | Mobile Finding | Mobile Evidence | Mobile Test | Assessment |
|----------|---------|----------------|-----------------|-------------|------------|
| Typography | High | High | High | High | Pass |
| Colors / Contrast | High | High | High | High | Pass |
| Layout / Spacing | High | High | High | High | Pass |
| Components | High | High | High | High | Pass |
| Accessibility | Partial | Partial | Partial | Partial | In progress |

**Overall:** layout, typography, color and components pass the design review. Accessibility
is deliberately marked in progress rather than passed.

## Accessibility scope
Shipped today: the Audience Response Timeline offers a keyboard-reachable **Table View**
toggle so chart data is available as text, interactive controls carry `aria-label` /
`aria-expanded` / `aria-haspopup` attributes, and the dark theme was tuned for legible
contrast. Not yet done: dialog focus trapping and dialog semantics on the project-creation
overlay, skip navigation, and a complete screen-reader and 200%-zoom pass. We do not claim
WCAG 2.2 AA conformance.

## Reference Comparison
- **Desktop (1568x1000)**: The Finding view reconstructs the three-column layout -- player
  and scene timeline, analysis center column, and the evidence column carrying the collapsed
  ClickHouse MCP Telemetry Trail above the hypothesis card. The Audience Response Timeline is
  a hand-rolled SVG chart drawn with the app's design tokens (`--lime`, `--violet`,
  `--coral`); Recharts is used separately on the Results page
  (`src/pages/ExperimentResultsPage.tsx`).
- **Mobile Finding (390x844)**: A purpose-built mobile layout with persistent bottom
  navigation rather than a collapsed desktop grid. The timeline header and legend wrap onto
  additional lines instead of crowding, and all five retention series -- overall plus the
  18-24, 25-34, 35-44 and 45+ cohorts -- remain legible.
- **Mobile Evidence (390x844 and 375x667)**: The filmstrip scroll, cohort comparison cards
  and query-provenance drill-in render within the viewport at both widths.
- **Mobile Test (390x844)**: The A/B test configuration screen renders under a `CONFIG
  DRAFT` state, with the control and variant cut cards laid out side by side above the
  approval gate. The approval control itself sits below the fold and so is not visible in
  the capture.

## Generated Screenshots
Captured against production (git_sha `c1c06e0`) by `tests/e2e/visual_qa.spec.ts`:
- `momentlab-built.png` -- desktop Finding, 1568x1000
- `momentlab-mobile-finding.png` -- mobile Finding, 390x844
- `momentlab-mobile-evidence-390.png` and `momentlab-mobile-evidence-390-sql.png` -- mobile Evidence, 390x844
- `momentlab-mobile-evidence-375.png` and `momentlab-mobile-evidence-375-sql.png` -- mobile Evidence, 375x667
- `momentlab-mobile-test.png` -- mobile Test, 390x844

To refresh them, run the spec with its `baseURL` pointed at the deployed site; the default
config targets `http://localhost:3000`.
