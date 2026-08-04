# MomentLab Antigravity execution package

Antigravity must apply all files under `rules/` continuously and execute one bounded file under `workflows/` at a time. The master prompt is the product specification; these workflows turn it into verified increments.

Recommended order:

1. `.agents/workflows/00-audit-and-plan.md`
2. `.agents/workflows/01-ui-foundation.md`
3. `.agents/workflows/02-film-and-events.md`
4. `.agents/workflows/03-clickhouse-mcp.md`
5. `.agents/workflows/04-gemini-agent-and-approval.md`
6. `.agents/workflows/05-evaluation-and-visual-qa.md`
7. `.agents/workflows/06-gcp-deploy-and-submission.md`

Do not skip the UI foundation. Do not report a workflow complete without its named artifacts and reproducible verification output.
