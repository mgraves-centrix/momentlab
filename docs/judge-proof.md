# Judging Criteria Proof

This document maps the Agentic Cinema Hackathon judging criteria to concrete evidence in the MomentLab repository and demonstration.

## 1. Technological Implementation (25%)
**Does the project use the official ClickHouse MCP server, Google ADK, and Vertex AI as required?**

* **Google ADK & Vertex AI**: We strictly use `google-adk` as validated by our custom CI hook (`check-ai-compliance.py`). The model is accessed exclusively via Vertex AI (`backend/agents/mcp_client.py`).
* **ClickHouse MCP**: We successfully integrated the official `ClickHouse/mcp-clickhouse` server. The agent uses this MCP to execute analytical queries against the `audience_events` table. The live telemetry of this usage is streamed directly into the right-hand panel of the `Finding` UI.
* **Architecture Quality**: MomentLab features a production-grade FastAPI backend, a typed React frontend, and Terraform infrastructure as code (`infra/terraform/main.tf`).

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
