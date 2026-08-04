# MomentLab UI fidelity skill

Use this skill whenever implementing or reviewing a MomentLab route or shared visual component.

1. Read `UI-IMPLEMENTATION-CONTRACT.md` completely.
2. Open the dedicated reference image for the target route and the two system boards. Record the review.
3. List the route’s visible regions, reusable components, states, interactions, and accessible alternatives before editing.
4. Implement from shared tokens and typed data. Do not use reference pixels as production UI.
5. Capture the required viewports and compare hierarchy, geometry, typography, spacing, color, data semantics, interaction, and state behavior.
6. Log discrepancies in `docs/visual-qa.md`, fix highest severity first, and repeat.
7. Declare the route complete only when the global scorecard and all hard gates pass.
