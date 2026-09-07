# 3-Minute Video Demo Script

## Timeline & Narration

### 0:00–0:20 — The Problem (Costly Editorial Uncertainty)
**Visual:** Show the MomentLab project dashboard (`/projects`).
**Narration:** "Every year, studios spend millions on reshoots and test screenings, guessing why audiences churn. We built MomentLab for the Agentic Cinema Hackathon to turn raw playback telemetry into falsifiable edit experiments."

### 0:20–0:45 — The Data (Consented Screening Signals)
**Visual:** Show the mobile-optimized screening consent screen, followed by the video player (`/screen/demo_token_123`).
**Narration:** "It starts with consented viewers. We collect second-by-second playback events—pauses, rewinds, and explicit reactions—and stream them into a high-performance ClickHouse database. Watch as we inject a batch of deterministic screening events."

### 0:45–1:25 — Agent Detection (ClickHouse MCP)
**Visual:** Show the desktop `Finding` workspace. Highlight the "Response Cliff" on the chart. Zoom in on the "ClickHouse MCP" connected activity panel on the right.
**Narration:** "Here’s where it gets interesting. Our Google ADK agent, powered by Gemini 2.5 Pro, detects an anomaly. Instead of guessing, it uses the official ClickHouse MCP server to query the actual live database, slicing the 18-24 cohort data to investigate a massive 28% drop-off at exactly 00:33."

### 1:25–1:55 — Falsifiable Edit Hypothesis
**Visual:** Emphasize the "Edit Hypothesis" card. "MOVE REVEAL 6S EARLIER". Show the cited evidence IDs.
**Narration:** "Gemini synthesizes the SQL results into a falsifiable edit hypothesis: *Move the reveal 6 seconds earlier.* It cites the exact timecode and query run IDs for complete provenance."

### 1:55–2:15 — Human Approval Gate
**Visual:** Switch to the mobile view (`/projects/.../test`). Show the locked "Approve & Launch" button. The user checks the approval, and the button unlocks and is clicked.
**Narration:** "AI shouldn't deploy changes unilaterally. We implemented a cryptographically secure Human Approval Gate. An authenticated editor reviews the Cut B draft, clicks approve, and launches the test."

### 2:15–2:40 — Evaluation
**Visual:** Flash the evaluation output from the terminal `evaluation-report.md` showing a measured +11.1% engagement lift at 99% confidence (versus +18% forecast).
**Narration:** "Once Variant B results are in, the system statistically evaluates the outcome. While the agent forecast an +18% lift, the measured result in ClickHouse is +11.1% at 99% confidence—confirming the hypothesis is supported while proving our predictions are falsifiable."

### 2:40–3:00 — Conclusion
**Visual:** Show the architecture diagram or the Cloud Run deployment log.
**Narration:** "MomentLab is built on Google Cloud Run, Vertex AI, and ClickHouse Cloud. By bridging the reasoning of Gemini with the analytical speed of ClickHouse, we've created an indispensable tool that takes the guesswork out of filmmaking."
