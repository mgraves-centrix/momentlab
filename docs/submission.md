# Devpost Submission: MomentLab

## Elevator Pitch
MomentLab turns consented, second-by-second audience behavior into the next controlled edit experiment. Stop guessing why your audience churns—let a ClickHouse-backed Gemini agent investigate the data and propose a falsifiable A/B test.

## It's Not Just a Dashboard
MomentLab is an end-to-end autonomous audience-experiment agent designed for filmmakers. Rather than providing static sentiment tracking, MomentLab uses Google Agent Development Kit (ADK) and Vertex AI to proactively query ClickHouse (using the official MCP) and find the exact reason an audience drops off.

## What it Does
1. **Consent & Capture**: Collects consented playback events and explicit reactions across two cuts.
2. **High-Performance Analytics**: Aligns events to media time and stores them in ClickHouse.
3. **Agent Investigation**: The `FlowAnalystAgent` investigates the dataset through the official `ClickHouse/mcp-clickhouse` server.
4. **Actionable Hypothesis**: Uses Gemini to explain the evidence and propose one falsifiable edit hypothesis (e.g., "Move reveal 6 seconds earlier").
5. **Human Approval Gate**: Requires cryptographic human approval to launch an A/B test.
6. **Rigorous Evaluation**: Evaluates Variant B when results arrive and reports statistical support.

## How we Built It
- **Frontend**: React + Vite + TypeScript, featuring a fully responsive mobile-to-desktop professional editing UI.
- **Backend**: Python FastAPI with Pydantic for high-throughput event ingestion and robust agent orchestration.
- **Agent Intelligence**: Google Agent Development Kit (`google-adk`) powered by Gemini 1.5 Pro on Vertex AI.
- **Database Partner**: We used the official `ClickHouse/mcp-clickhouse` to bridge LLM reasoning with ClickHouse's unparalleled speed for analytical queries.
- **Infrastructure**: Deployed on Google Cloud Run, utilizing Artifact Registry, Secret Manager, and Cloud Build.

## Challenges We Ran Into
Getting the AI agent to confidently read complex telemetry data without hallucinating required strict usage of the ClickHouse MCP. By allowing the agent to query the time-series aggregations directly, we removed hallucinations and improved hypothesis accuracy. We also spent significant effort building a responsive design that degrades gracefully into a focused mobile experience, maintaining the "premium editorial-workstation character".

## Accomplishments We're Proud Of
- Passing a strict **AI Compliance Check** ensuring 100% adherence to Google ADK and Vertex AI.
- Building an architecture where the AI has zero ability to silently launch tests; it is strictly an evidence-backed advisor locked behind an immutable **Human Approval Gate**.
- Visual fidelity and accessibility checks confirming adherence against the provided editorial workstation design references.

## What's Next for MomentLab
- Integrating Pub/Sub for millions of concurrent screening events.
- Creating native Adobe Premiere Pro and DaVinci Resolve integrations for the recommended edit hypotheses.
