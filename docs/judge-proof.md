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
* **Responsive Mobile Experience**: Rather than a clunky collapse of the desktop dashboard, MomentLab provides three dedicated mobile routes (`Finding`, `Evidence`, `Test`) with a native-feeling persistent bottom navigation.
* **Accessibility**: The application conforms to WCAG 2.2 AA standards, ensuring keyboard-navigable charts, accessible tooltips, and appropriate contrast for the "dark mode" aesthetic.

## 3. Potential Impact (25%)
**Does this tool solve a real problem for the target audience?**

* **Cost Reduction**: Re-shoots and failed test screenings cost studios millions. MomentLab minimizes the guesswork by tying explicit audience drop-offs directly to the exact frame and timeline.
* **Data-Driven Confidence**: By providing falsifiable hypotheses (e.g., "Move reveal 6 seconds earlier"), it empowers editors to make changes backed by statistical confidence rather than intuition alone.
* **Privacy-First**: The solution completely avoids invasive biometrics (no cameras or facial recognition), relying solely on explicit, consented in-player reactions.

## 4. Quality of the Idea (25%)
**Is the concept creative, original, and well-suited to the ClickHouse track?**

* **Originality**: Instead of building a generic "chat-with-your-database" interface, MomentLab utilizes the AI agent as a proactive, background data analyst that discovers anomalies and presents *proposed experiments* to the human.
* **ClickHouse Synergy**: The solution perfectly leverages ClickHouse. By processing high-throughput, time-series telemetry (scrubbing, pausing, reacting) at millisecond precision, ClickHouse provides the raw speed necessary for the Gemini agent to investigate anomalies across distinct demographic cohorts in near real-time.
