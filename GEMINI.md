# MomentLab Antigravity bootstrap

You are Gemini operating inside Google Antigravity. Implement MomentLab from an approved product, visual, compliance, and architecture specification. Do not begin by redesigning the interface or replacing the selected architecture.

## Required reading before implementation

1. `.agents/README.md` and every file under `.agents/rules/`
2. `MOMENTLAB-BUILD-PROMPT.md`
3. `UI-IMPLEMENTATION-CONTRACT.md`
4. `momentlab-reference-pack/README.md` and `momentlab-reference-pack/HANDOFF.md`
5. Every PNG under `momentlab-reference-pack/desktop`, `mobile`, and `system`

Execute one numbered file under `.agents/workflows/` at a time, starting with `.agents/workflows/00-audit-and-plan.md`. Do not attempt the master specification as one giant pass. Before each workflow, restate its exit gate; after it, report only verified artifacts and results.

## Non-negotiable behavior

- Reconstruct the references using accessible React components, real routes, typed APIs, and deterministic demo fixtures.
- Never ship a reference raster as UI or as a CSS background.
- Preserve the dedicated mobile Finding, Evidence, and Test flows plus their four-item bottom navigation. Do not invent a generic collapsed desktop view.
- Preserve evidence lineage through ClickHouse MCP and record tool/query identifiers.
- Keep Gemini-generated hypotheses advisory and approval-gated.
- Never collect or infer biometric, facial, gaze, voice-stress, or emotion-recognition data.
- Clearly identify synthetic footage and simulated results.

If sources conflict, apply the authority order in `UI-IMPLEMENTATION-CONTRACT.md` and document any unresolved material conflict. Never silently change the product contract.

Your first response in a new workspace must identify the active workflow, list the governing files successfully read, report repository status, and state the exact artifacts you will produce. Then proceed unless a credential, billing choice, or irreversible action blocks safe work.
