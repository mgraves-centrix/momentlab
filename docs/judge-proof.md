# Judging Criteria Proof

This maps each judging criterion to something you can check, either in this repository or in
the running app.

About the data: the demo runs on a seeded telemetry set of 35,001 respondents for the
Northlight experiment, spread across four age cohorts, and on synthetic scene footage that the
UI labels SYNTHETIC wherever it appears. The screening flow also accepts live respondents. The
agent, the ClickHouse queries, the aggregation and the measurement path are all real. Only the
viewers in the demo dataset are generated.

## 1. Technological Implementation (25%)
**Does the project use the official ClickHouse MCP server, Google Cloud Agent Builder (via Google ADK), and Vertex AI as required?**

**Google ADK and Vertex AI.** MomentLab runs on Google's Agent Development Kit (`google-adk`),
the agent framework behind Vertex AI Agent Builder. The ADK `Agent` and `Runner` are imported
and invoked at runtime in `backend/agents/mcp_client.py`. A CI hook, `check-ai-compliance.py`,
checks that on every build, so the dependency is exercised rather than just declared. The model
is reached only through Vertex AI. Safety settings are explicit: `generate_content_config` sets
all four `HarmCategory` entries to `BLOCK_MEDIUM_AND_ABOVE`. There is a second Gemini 2.5 Pro
call that does multimodal grounding on the anomaly window, but it only corroborates. ClickHouse
is the primary evidence source and the agent queries it first.

**ClickHouse MCP.** The official `ClickHouse/mcp-clickhouse` server runs against live ClickHouse
Cloud, server version `26.4.1.2212` as reported by `/health`. The agent uses it to run
analytical queries against `audience_events`, `retention_by_second_aggregated` and
`reaction_anomalies_aggregated`. Those executions feed the ClickHouse MCP Telemetry Trail in the
right-hand panel of the Finding screen, which opens as one collapsed bar showing the query count
and expands to the full paginated trail in a click.

**Architecture and custom domain.** FastAPI backend, typed React frontend, Terraform for infra
(`infra/terraform/main.tf`). The app is reachable at `https://momentlab.ai` and
`https://www.momentlab.ai` through Cloud Run domain mappings, with the origin still available at
`https://momentlab-web-qa24oxtrrq-uc.a.run.app`.

**Per-cohort aggregation that is actually per-cohort.** Retention is aggregated in an
`AggregatingMergeTree` materialized view keyed by
`(project, experiment, scene, respondent_cohort, media_time_ms)`, joining playback events to
screening sessions. Each age cohort (18-24, 25-34, 35-44, 45+) is a real dimension, not a copy
of the overall average. The "All" line is not an average of averages either: it merges the
underlying `avg` aggregate states across cohort rows, which gives the true sample-weighted mean.
Buckets below the "MINIMUM COHORT SIZE 10" floor shown on the consent screen are not plotted, so
a one-respondent tail cannot masquerade as a retention collapse. The anomaly detector already
applied that same rule before reporting a finding.

## 2. Design & Usability (25%)
**Does the application have an intuitive, professional, and accessible user interface?**

**Visual fidelity.** The interface follows the editorial workstation reference designs closely.
See `docs/visual-qa.md` for the screen-by-screen comparison.

**Responsive mobile, verified at 375px.** The mobile views are purpose-built rather than a
collapsed desktop grid: dedicated Finding, Evidence and Test routes with persistent bottom
navigation, plus a separate screening consent and player. All eight primary screens (projects,
finding, evidence, test, more, hypothesis, results, and the participant screening page) were
checked at a 375px viewport with zero horizontal page overflow, confirmed by an element-level
sweep for nodes extending past the viewport. One element is deliberately wider than the phone:
the cohort-breakdown table on the results screen, which scrolls inside its own container instead
of crushing six numeric columns into 329px. The timeline header and legend wrap rather than
crowd, all five retention series stay legible, and the screening video shows a loading spinner
while it buffers so it never looks frozen. Destructive operator controls such as telemetry reset
are absent from navigation and sit behind an explicit operator flag, so the participant flow
exposes nothing dangerous.

**Accessibility, with WCAG 2.2 AA as the target.** Some of it ships today. The Audience Response
Timeline has a keyboard-reachable Table View toggle, so the chart data is available as text.
Interactive controls carry `aria-label`, `aria-expanded` and `aria-haspopup`. The dark theme was
tuned for legible contrast. Full AA conformance is not claimed yet. Known gaps: dialog focus
trapping and dialog semantics on the project-creation overlay, skip navigation, and a complete
screen-reader and 200% zoom pass.

**Labels that do not overclaim.** Every figure carries its state. PREDICTED means a pre-test
forecast, MEASURED means a post-experiment result, and agent hypotheses are marked GROUNDED or
UNGROUNDED depending on whether real ClickHouse queries back them. "Verified" is reserved for
system-state confirmations like server-side approval or materialized-view sync, never for a
forecast or a confidence figure. Status indicators follow the same rule. The AGENTS ONLINE pill
reflects real service health and the number of agent runs in the last fifteen minutes, and shows
an "idle" chip when there have been none. It appears only in the operator shell; the public
screening page carries no agent telemetry at all. The copy is written for filmmakers: "Viewers
disengage at 00:37", not "anomaly detected".

**Provenance you can scan.** The ClickHouse MCP Telemetry Trail shows the agent's real
query-level provenance: up to 50 recent executions with per-query duration and row counts, and a
drill-in with the exact SQL for any one of them. It starts collapsed to a single bar carrying the
query count so the hypothesis beside it is visible immediately, then expands to a trail paginated
at 10 or 25 per page. The same panel backs both the Finding and Evidence views. At 375px the
count, the page-size selector and the Previous / Next controls each fit on one line without
overflow. The mobile Finding view leaves the trail out to keep that screen lean; provenance is one
tap away on the Evidence tab.

## 3. Potential Impact (25%)
**Does this tool solve a real problem for the target audience?**

**A timestamp instead of an adjective.** A test screening comes back with impressions. MomentLab
comes back with a bounded interval: a -18.1% retention drop at 00:37, window 00:33-00:41, at 95%
calibrated confidence, computed across roughly 2.08 million playback events. That gives an editor
a frame range to work on instead of a feeling to interpret.

**Cost.** Re-shoots and failed test screenings are expensive and slow, and the feedback arrives
too coarse to act on. Tying a drop-off to an exact frame range lets an editor test one targeted
change rather than guess, then find out whether it worked.

**Falsifiable, not advisory.** Each hypothesis ships as a testable proposal with a predicted
effect and a human approval gate. The agent proposes, a person approves, and the outcome gets
measured against the prediction instead of assumed. In the demo experiment the proposed cut
measured a +11.1% engagement lift (95% CI [+10.9%, +11.4%], 99% confidence, 17,500 respondents
per arm). Only then was it reported as MEASURED.

**Privacy.** No cameras, no facial recognition, no gaze tracking, no vocal analysis. Only
explicit, consented in-player reactions and playback events, aggregated behind a minimum cohort
size of 10 so that no plotted bucket can describe a single respondent.

## 4. Quality of the Idea (25%)
**Is the concept creative, original, and well-suited to the ClickHouse track?**

**Originality.** This is not a chat-with-your-database wrapper. The agent works like a background
analyst: it detects the retention anomaly, queries ClickHouse for corroborating evidence, and
puts up a proposed experiment for a human to approve or reject. The person stays the
decision-maker and the agent supplies the evidence.

**Why ClickHouse fits.** Second-by-second retention over millisecond-stamped playback events is
an `AggregatingMergeTree` workload almost by definition. Cohort-keyed aggregate states let one
table serve the overall curve and four cohort curves without rescanning raw events, and the UI
prints the comparison it measured on each request. On a representative load the materialized view
answered in about 48ms against a 128ms raw scan of the same window. That headroom is what makes
the agent's investigation interactive rather than an overnight batch.

**Reproducible.** The demo dataset is seeded and the aggregates rebuild from raw events using
scripts in the repo (`backend/scripts/seed_clickhouse.py`,
`backend/scripts/rebuild_materialized_views.py`), so every number the interface shows can be
reconstructed from source instead of taken on trust.
