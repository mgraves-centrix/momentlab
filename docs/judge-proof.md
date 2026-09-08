# Judging Criteria Proof

This document maps the Agentic Cinema Hackathon judging criteria to concrete evidence in the MomentLab repository and demonstration.

## 1. Technological Implementation (25%)
**Does the project use the official ClickHouse MCP server, Google Cloud Agent Builder (via Google ADK), and Vertex AI as required?**

* **Google ADK & Vertex AI**: MomentLab is built with Google's Agent Development Kit (`google-adk`), the official agent framework of Vertex AI Agent Builder. This satisfies the hackathon requirement to be "powered by Gemini and Google Cloud Agent Builder": the ADK `Agent` and `Runner` are imported and actually invoked at runtime in `backend/agents/mcp_client.py` (validated by our custom CI hook `check-ai-compliance.py`), demonstrating true runtime usage of the accepted `google-adk` package. The model is accessed exclusively via Vertex AI. We enforce explicit Gemini safety settings (`generate_content_config` with all four `HarmCategory` entries configured at `BLOCK_MEDIUM_AND_ABOVE`). Additionally, a second-stage Gemini 2.5 Pro multimodal video grounding call provides corroborating visual observations of the anomaly window; ClickHouse remains the primary evidence source and the agent queries it first.
* **ClickHouse MCP**: We successfully integrated the official `ClickHouse/mcp-clickhouse` server connected to live ClickHouse Cloud (running server version `26.4.1.2212` as reported by `/health`). The agent uses this MCP to execute analytical queries against ClickHouse telemetry tables (`audience_events`, `retention_by_second_aggregated`, `reaction_anomalies_aggregated`). The live telemetry of this usage is streamed directly into the right-hand panel of the `Finding` UI.
* **Architecture Quality & Custom Domain**: MomentLab features a production-grade FastAPI backend, a typed React frontend, and Terraform infrastructure as code (`infra/terraform/main.tf`). The live application is reachable at `https://momentlab.ai` and `https://www.momentlab.ai` via Cloud Run domain mappings (with origin fallback at `https://momentlab-web-qa24oxtrrq-uc.a.run.app`).

## 2. Design & Usability (25%)
**Does the application have an intuitive, professional, and accessible user interface?**

* **Visual Fidelity**: MomentLab reconstructed the premium editorial workstation reference designs with faithful fidelity (see `docs/visual-qa.md`).
* **Responsive Mobile Experience (verified at 375px)**: Rather than a clunky collapse of the
  desktop dashboard, MomentLab ships purpose-built mobile layouts -- dedicated
  `Finding` / `Evidence` / `Test` routes with a persistent bottom navigation, and a
  mobile-specific screening consent + player. Every primary screen (projects dashboard,
  finding, evidence, the mobile "More" menu, and the participant screening) was verified at
  a 375px viewport with **zero horizontal overflow**. The Audience Response Timeline header
  and legend wrap cleanly on narrow widths instead of crowding, and the screening video
  shows a loading spinner while it buffers so it never appears frozen. Destructive operator
  controls (telemetry reset) are removed from navigation and gated behind an explicit
  operator flag, so the mobile participant flow exposes nothing dangerous.
* **Accessibility (WCAG 2.2 AA as the target)**: MomentLab targets WCAG 2.2 AA and ships concrete pieces of it today: the Audience Response Timeline provides a keyboard-reachable **Table View** toggle so chart data is available as text, interactive controls carry `aria-label` / `aria-expanded` / `aria-haspopup` attributes, and the dark theme was tuned for legible contrast. We do **not** claim full AA conformance yet -- known remaining work includes dialog focus trapping and dialog semantics on the project-creation overlay, skip navigation, and a complete screen-reader and 200%-zoom pass.
* **Honest evidence states (no overclaiming)**: Every figure is labeled by its epistemic state -- **PREDICTED** (a pre-test forecast) versus **MEASURED** (a post-experiment result), with agent hypotheses marked **GROUNDED / UNGROUNDED** by whether they are backed by real ClickHouse queries. The interface never labels a forecast or a statistical confidence as "verified"; that word is reserved for genuine system-state confirmations (e.g., server-side approval, materialized-view sync). Copy is filmmaker-first -- "Viewers disengage at 00:37", "A testable edit hypothesis", "drop-off" -- rather than raw system jargon, so the UI earns trust by describing exactly what each number is.
* **Provenance you can scan, not drown in**: The ClickHouse MCP Telemetry Trail shows the agent's real query-level provenance -- up to 50 recent executions with per-query duration and row counts. Instead of rendering one long wall that buries the analysis beside it, the panel paginates at **10 or 25 per page** with Previous / Next and a "Showing X-Y of Z" count, and it **collapses to a single bar** (retaining the query count) so the hypothesis and evidence next to it stay immediately reachable. The same shared panel backs both the Finding and Evidence views, and the behavior was verified live at desktop and 375px with no horizontal overflow.

## 3. Potential Impact (25%)
**Does this tool solve a real problem for the target audience?**

* **Cost Reduction**: Re-shoots and failed test screenings cost studios millions. MomentLab minimizes the guesswork by tying explicit audience drop-offs directly to the exact frame and timeline.
* **Data-Driven Confidence**: By providing falsifiable hypotheses (e.g., "Move reveal 6 seconds earlier"), it empowers editors to make changes backed by statistical confidence rather than intuition alone.
* **Privacy-First**: The solution completely avoids invasive biometrics (no cameras or facial recognition), relying solely on explicit, consented in-player reactions.

## 4. Quality of the Idea (25%)
**Is the concept creative, original, and well-suited to the ClickHouse track?**

* **Originality**: Instead of building a generic "chat-with-your-database" interface, MomentLab utilizes the AI agent as a proactive, background data analyst that discovers anomalies and presents *proposed experiments* to the human.
* **ClickHouse Synergy**: The solution perfectly leverages ClickHouse. By processing high-throughput, time-series telemetry (scrubbing, pausing, reacting) at millisecond precision, ClickHouse provides the raw speed necessary for the Gemini agent to investigate anomalies across distinct demographic cohorts in near real-time.
