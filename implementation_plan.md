# Revamp ResponseTimelinePage (Finding) to Match Mockup

Based on the visual QA feedback for the Finding page, the layout and components need a significant overhaul to accurately reflect the `04-response-timeline.png` mockup.

## Open Questions
- You mentioned "Clickhouse MCP can move to the front". Does this mean the `McpActivityPanel` should be placed at the top of the right column, or somewhere else?
- For the Middle Column's "Proposed Experiment / Edit Comparison", should this use the `CutComparison` component currently shown on the A/B test page?
- For the "Audience Response timeline multiple lines", should it display lines for *each cohort* simultaneously (e.g., All, 18-24, 25-34)?

## Proposed Changes

### [Left Column]
- **MediaPlayer**: Keep at top.
- **Scene Notes**: Add missing scene notes immediately below the video.
- **Scene Timeline**: Rename/restyle `SceneFilmstrip` to "Scene Timeline".
- **Experiment Info**: Add missing experiment info (likely metadata about Experiment 23A) in the left column.

### [Middle Column]
- **Audience Response Timeline**: Update the chart to show multiple lines (representing multiple rows/cohorts). Ensure graphs match the mockup.
- **Proposed Experiment / Edit Comparison**: Add the Edit Comparison panel (Control Cut A vs Variant Cut B) into the middle column.
- **Expected Impact / Confidence**: Repurpose/rename the Confidence Meter to "Expected Impact" if that aligns with the mockup.

### [Right Column]
- **Clickhouse MCP**: Add the `McpActivityPanel` to the right column.
- **Edit Hypothesis**: Update the Gemini Edit Proposal to match the "Edit Hypothesis" box (branded buttons, rationale).
- **Human Approval**: Add the `ApprovalGate` (Human Approval) component to the right column.
