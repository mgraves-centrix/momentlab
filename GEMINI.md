# MomentLab agent instructions

You are implementing MomentLab from an approved product and visual specification. Do not begin by redesigning the interface or replacing the selected architecture.

## Required reading before implementation

1. `MOMENTLAB-BUILD-PROMPT.md`
2. `momentlab-reference-pack/README.md`
3. `momentlab-reference-pack/HANDOFF.md`
4. Every PNG under `momentlab-reference-pack/desktop`, `mobile`, and `system`

Create a route-to-reference checklist before building the shell. Screens 12 and 13 are release specifications for reusable components and product states.

## Non-negotiable behavior

- Reconstruct the references using accessible React components, real routes, typed APIs, and deterministic demo fixtures.
- Never ship a reference raster as UI or as a CSS background.
- Preserve the exact dedicated mobile Finding, Evidence, and Test flows. Do not invent a generic collapsed desktop view.
- Preserve evidence lineage through ClickHouse MCP and record tool/query identifiers.
- Keep Gemini-generated hypotheses advisory and approval-gated.
- Never collect or infer biometric, facial, gaze, voice-stress, or emotion-recognition data.
- Clearly identify synthetic footage and simulated results.

If a proposed implementation conflicts with the build prompt or reference pack, stop and document the conflict rather than silently changing the product contract.
