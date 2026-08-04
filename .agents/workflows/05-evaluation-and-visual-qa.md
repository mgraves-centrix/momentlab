# Workflow 05 — evaluation and release QA

Goal: replace claims with reproducible product, agent, interaction, and visual evidence.

1. Implement the hidden-ground-truth evaluator and metrics required by the master prompt.
2. Add agent trajectory tests for tool selection, grounding, citation validity, task completion, boundedness, and truthful `INCONCLUSIVE` behavior.
3. Complete unit, ClickHouse integration, MCP contract, API authorization, security misuse, accessibility, and Playwright end-to-end suites.
4. Re-run every visual viewport/state, update `docs/visual-qa.md`, and preserve final screenshots.
5. Add `make ui-verify`, `make verify`, and PowerShell equivalents; ensure CI emits machine- and human-readable reports.
6. Audit product copy and telemetry for false connected/live/causal/success claims.

Exit gate: all release gates have reproducible artifacts; UI remains at least 99/100 with no category below 98%; failures are fixed or explicitly marked blocking.
