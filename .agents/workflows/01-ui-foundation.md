# Workflow 01 — UI foundation

Goal: make the approved visual/product contract executable before backend breadth.

1. Implement tokens, fonts, icon system, shell, canonical router, responsive breakpoint behavior, and typed Northlight fixtures.
2. Build the reusable components named in `UI-IMPLEMENTATION-CONTRACT.md` with deterministic default and failure stories.
3. Implement desktop routes 04–08, then dedicated mobile route compositions 09–11 using shared domain components.
4. Implement project, consent, and audience-player routes 01–03.
5. Implement four-item mobile navigation and `/more`; preserve canonical URL/store state.
6. Add Playwright interaction and screenshot coverage at every required viewport plus automated accessibility checks.
7. Create `docs/visual-qa.md`, score it, compare, fix, and repeat until the release threshold is met.

Exit gate: every canonical route renders from typed fixtures; UI QA is at least 99/100 with no category below 98%; no hard accessibility, overflow, clipping, missing-state, or missing-route failure remains.
