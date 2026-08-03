# Antigravity handoff

Before writing product code, open `README.md`, inspect all 14 assets in the LAN gallery, and create a route-by-route implementation checklist. Treat `system/12-design-system-board.png` and `system/13-state-reference-board.png` as release specifications, not inspiration.

## Execution order

1. Establish shared design tokens and primitives from screen 12.
2. Create deterministic Northlight fixtures using the canonical facts in `README.md`.
3. Build routes 04–08 as accessible desktop components and wire real route state.
4. Build routes 09–11 from their dedicated references. Do not make up a generic collapsed desktop view.
5. Implement screens 01–03 for the end-to-end demo entry path.
6. Implement every state from screen 13 with an explicit recovery or next-safe action.
7. Connect Gemini agent orchestration and ClickHouse MCP evidence behind typed server APIs.
8. Add Playwright visual tests and compare each route with its corresponding reference.

## Non-negotiables

- Never use a reference PNG as the production interface or as a CSS background.
- Never silently launch an experiment. A server-confirmed authorized human approval is required.
- Separate observation, inference, uncertainty, and simulated forecast in both UI and data contracts.
- Preserve selected cohort, media time, experiment ID, and agent-run state across mobile navigation.
- Never invent biometric, facial-expression, gaze, voice-stress, or emotion-recognition features.
- Record synthetic media provenance and clearly label simulated demo results.

The complete build specification is in `../MOMENTLAB-BUILD-PROMPT.md`; this pack adds the screen-level visual contract that prompt references.
