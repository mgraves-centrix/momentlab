# Workflow 00 — audit and plan

Goal: establish a verified implementation baseline without writing speculative product code.

1. Inspect repository state, dependencies, existing implementation, and all governing files.
2. Open every reference image and complete `design/reference-review.md`.
3. Verify current rules and product dependencies against the primary sources listed in the master prompt; create `docs/sources.md`.
4. Create `docs/compliance-matrix.md`, `docs/route-reference-checklist.md`, `docs/decisions.md`, and `docs/progress.md`.
5. Write a concise architecture decision record covering boundaries, identity, ClickHouse identities, MCP transport, Agent Engine, and local adapters.
6. Turn the remaining workflows into a dependency-aware checklist with verification gates.

Exit gate: all references were actually opened, every source/path resolves, compliance has an owner and proof plan, and no unresolved architecture decision blocks UI foundation.
