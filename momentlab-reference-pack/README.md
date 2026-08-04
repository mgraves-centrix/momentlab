# MomentLab implementation reference pack

This pack is the visual contract for rebuilding MomentLab as a live, responsive web product. The images define hierarchy, density, language, and state coverage. They are references only: do not ship them as backgrounds or substitute them for accessible UI components.

## Canonical demo facts

- Project: `Northlight`
- Scene: `12 · INT. APARTMENT – NIGHT`
- Experiment: `23A`
- Respondents: `4,732`
- Detected moment: `00:37`
- Affected range: `00:33–00:41`
- Response cliff: `−28%`
- Hypothesis: `MOVE REVEAL 6S EARLIER`
- Confidence: `91%`
- Control Cut A: reveal at `00:43`
- Variant Cut B: reveal at `00:37`
- Forecast/demo result: engagement `+18%`, completion `+9%`, confused change `−4%`

## Screen map

| ID | Asset | Intended route/state | Build purpose |
|---|---|---|---|
| 01 | `desktop/01-project-dashboard.png` | `/projects` | Project and screening overview |
| 02 | `desktop/02-screening-consent.png` | `/screen/:screeningToken` before consent | Consent and privacy state |
| 03 | `desktop/03-audience-player.png` | `/screen/:screeningToken` after consent | Playback and response capture state |
| 04 | `desktop/04-response-timeline.png` | `/projects/:projectId/experiments/:experimentId/finding` | Primary desktop workspace |
| 05 | `desktop/05-moment-evidence.png` | `.../evidence` | Evidence, uncertainty, and MCP trace |
| 06 | `desktop/06-edit-hypothesis.png` | `.../hypothesis` | Agent proposal and human decision |
| 07 | `desktop/07-create-ab-test.png` | `.../test` | Approval-gated experiment setup |
| 08 | `desktop/08-experiment-results.png` | `.../results` | Simulated outcome and statistical evidence |
| 00 | `mobile/00-mobile-workflow-composite.png` | Mobile workflow overview | Canonical composition |
| 09 | `mobile/09-mobile-finding.png` | `.../finding` at 390 px | Mobile finding route |
| 10 | `mobile/10-mobile-evidence.png` | `.../evidence` at 390 px | Mobile evidence route |
| 11 | `mobile/11-mobile-test.png` | `.../test` at 390 px | Mobile experiment route |
| 12 | `system/12-design-system-board.png` | Storybook/design tokens | Reusable UI contract |
| 13 | `system/13-state-reference-board.png` | Storybook/state fixtures | Edge-state and recovery coverage |

## Fidelity order

1. Preserve information architecture, evidence semantics, and approval gates.
2. Preserve layout proportions, density, visual hierarchy, and exact product language.
3. Preserve semantic colors and component behavior from the design-system board.
4. Adapt for accessibility and real data without inventing a different mobile experience.
5. Keep all demo values in deterministic fixtures, not scattered component constants.

The mobile references establish a four-item bottom navigation labeled exactly `Finding`, `Evidence`, `Test`, and `More`. The first three map to their dedicated routes. `More` is a compact navigation route for Results, Project, Help, and authorized demo controls; it must use existing system primitives and must not displace or redesign the primary workflow. The mobile Finding reference is authoritative and does not add the desktop four-metric row.

## Visual acceptance

- Build with semantic React components, real routing, live chart data, keyboard support, and 44 × 44 px minimum touch targets.
- Validate desktop at 1568 × 1000, 1280 × 800, and 1024 × 768.
- Validate mobile routes independently at 390 × 844 and 430 × 932.
- Cover every state on the state board in Storybook or an equivalent deterministic route.
- Clearly label generated forecasts and results as simulated; never imply causation.
- Use aggregated, consented responses only. Do not collect or infer biometric or emotion data.

See `../UI-IMPLEMENTATION-CONTRACT.md` for the canonical route/component/state contract, `HANDOFF.md` for the Antigravity execution sequence, and `GENERATION-PROMPTS.md` for asset provenance.
