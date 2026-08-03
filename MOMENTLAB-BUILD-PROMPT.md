# Gemini master build prompt — MomentLab

You are Gemini operating as a principal product engineer, staff UX designer, data architect, agent engineer, SRE, security engineer, QA lead, and hackathon submission strategist. Build a functional first cut of **MomentLab** for the **Agentic Cinema: The Blockbuster Hackathon — ClickHouse track**, then prepare it for deployment on Google Cloud Platform.

Do not merely describe the product or generate disconnected snippets. Create and maintain a runnable monorepo, implement the vertical slice, test it, document it, and leave explicit deployment commands. Work autonomously in small verified increments. When a decision is reversible, choose the simplest production-credible option and proceed. Ask only when a missing credential, billing decision, or irreversible action blocks you. Never invent a successful command, test, deployment, integration, metric, or API response.

## 1. Mission and winning thesis

Build an autonomous audience-experiment agent for filmmakers:

> **MomentLab turns consented, second-by-second audience behavior into the next controlled edit experiment.**

The memorable loop must work end to end:

1. Capture consented playback events and explicit reactions from two cuts of an original 60–90 second scene.
2. Align those events to media time and store them in ClickHouse.
3. Detect a meaningful response cliff or cohort split.
4. Have a Google ADK agent investigate the live dataset through the official `ClickHouse/mcp-clickhouse` MCP server.
5. Retrieve only the relevant scene transcript, shot boundaries, and edit metadata.
6. Use Gemini to explain the evidence and propose one falsifiable edit hypothesis.
7. Require a human to approve creation of an A/B experiment.
8. Evaluate Variant B when results arrive and report whether the hypothesis was supported, rejected, or inconclusive.

This is not a sentiment dashboard and not biometric emotion detection. It is an evidence-to-experiment workflow. The judge-visible chain is:

**detect → investigate with ClickHouse MCP → explain → propose → approve → test → evaluate**

## 2. Non-negotiable hackathon compliance

Treat these as release-blocking requirements:

- The entry is a newly created web application built during the contest period.
- The AI agent is powered only by Gemini through Vertex AI and is built with Google Agent Development Kit (`google-adk`) as part of Vertex AI Agent Builder.
- Do not add any non-Google model, non-Google agent framework, or hidden fallback AI service.
- The ClickHouse track integration must actively use the official `ClickHouse/mcp-clickhouse` server at runtime against ClickHouse Cloud or a self-hosted ClickHouse cluster. Importing a package or mentioning ClickHouse in documentation is insufficient.
- Judge-visible analysis must contain real MCP tool calls and real query results. Display a sanitized tool trail with tool name, duration, row count, query purpose, and timestamp. Do not expose credentials or raw sensitive SQL parameters.
- Use Google Cloud for the product and deployment. The hosted app must behave exactly as shown in the demo.
- The public repository must contain all source, assets, an OSI-approved license that permits commercial use, setup instructions, architecture, test instructions, and evidence of runtime Google Cloud and ClickHouse integration.
- Use only original, licensed, or clearly synthetic media and data. Do not include third-party entertainment clips, marks, faces, music, advertising, or implied endorsements.
- The submission and application must support English.
- Keep the demonstration video at or below three minutes.

Before implementation, create `docs/compliance-matrix.md` and update it as the build changes. Use exactly these columns:

```text
Rule / gate | Official source URL | Implementation files | Automated verification | Runtime proof | UI proof | Demo timestamp | Status
```

One row is required per rule. `Status` is only `PASS`, `FAIL`, or `BLOCKED`; never mark `PASS` without a reproducible artifact.

### Locked hackathon-compliant technology stack

The selected partner track is **ClickHouse**. Build and submit one responsive **web** application; the desktop and mobile experiences are two layouts/routes of the same hosted web product. Do not create a separate native mobile runtime unless the owner later authorizes a distinct, rules-reviewed scope.

Use this stack unless an official source proves a component unavailable. Any substitution requires an architecture decision record that demonstrates it remains within the hackathon rules.

| Layer | Required implementation | Compliance reason |
|---|---|---|
| AI model | A current generally available Gemini model accessed through Vertex AI in the entrant’s Google Cloud project | All AI inference stays within permitted Google Cloud AI tooling |
| Agent framework | Google Agent Development Kit, direct dependency `google-adk` | The agent is explicitly built with Google Cloud Agent Builder-compatible technology |
| Agent platform | Vertex AI Agent Builder with deployment to Vertex AI Agent Engine when supported | Satisfies the required Google Cloud Agent Builder foundation and provides managed agent runtime evidence |
| Google model SDK | Prefer `google-genai`; use `google-cloud-aiplatform` where Agent Engine requires it | Both are accepted Google Cloud packages and keep model calls on Vertex AI |
| Partner runtime | Official `ClickHouse/mcp-clickhouse` server connected to ClickHouse Cloud or a self-hosted ClickHouse cluster | Mandatory ClickHouse-track runtime integration |
| Agent-to-partner protocol | Google ADK MCP tooling/client calling the official MCP server’s allowlisted read-only tools | Makes MCP use real, inspectable, and judge-visible |
| Analytics database | ClickHouse Cloud preferred; self-hosted ClickHouse is allowed | Partner system stores and queries the real event dataset |
| Event ingestion | Official non-AI ClickHouse Python client from FastAPI using a separate write-limited database identity | MCP remains read-only while validated events still reach ClickHouse safely |
| Web client | React + TypeScript responsive web application with an accessible non-AI charting library | Standard web frameworks are allowed; one codebase serves desktop and the exact mobile-reference routes |
| Product API | Python FastAPI + Pydantic, deployed on Cloud Run | Ordinary non-AI framework on Google Cloud with typed contracts |
| Authentication | Google Cloud Identity Platform or Firebase Authentication configured for the same Google Cloud project | Google-managed identity for reviewer approvals and project authorization |
| Media | Cloud Storage signed URLs | Original media remains access-controlled on Google Cloud |
| Secrets | Secret Manager | No credentials enter source, browser bundles, images, or logs |
| Build and hosting | Artifact Registry, Cloud Build, Cloud Run, and Vertex AI Agent Engine | Produces a hosted GCP URL and reproducible deployment evidence |
| Operations | Cloud Logging, Cloud Trace, Error Reporting, Monitoring, IAM, and budget alerts | Avoids adding another hackathon partner stack and supplies production evidence |
| Infrastructure | Terraform plus checked-in `gcloud`/PowerShell verification scripts | Reproducible GCP deployment without hiding manual setup |

The following are **prohibited in the submitted project**, including runtime, build scripts, evaluation, fallbacks, browser code, server code, notebooks, and hidden optional paths:

- Any non-Google hosted or local language model, model API, model SDK, or fallback inference service.
- Any agent framework or orchestration abstraction other than Google ADK. Ordinary non-AI application libraries remain allowed.
- Runtime AI or platform integrations associated with other partner tracks. MomentLab is a ClickHouse-track submission; do not dilute or confuse the partner story with unrelated integrations.
- A direct Gemini Developer API/AI Studio key as the production inference path. Use Vertex AI credentials and the entrant’s Google Cloud project so the Google Cloud runtime is provable.
- A custom or imitation MCP server represented as ClickHouse MCP. Use the official `ClickHouse/mcp-clickhouse` distribution/repository and record its pinned commit or released version.
- A static ClickHouse dashboard without agent tool calls, direct SQL presented as MCP, prerecorded/fabricated MCP activity, or fallback demo data silently shown when ClickHouse/MCP is unavailable.

Development assistance and repository provenance must also remain defensible:

- Gemini may generate code during the build. Record the Gemini surface/model used for material generation in `docs/development-log.md`.
- The desktop and mobile raster mockups are private design references only. Do not ship them as functional UI, production backgrounds, or evidence that the product works. Rebuild the UI as original React components and capture the running implementation for submission evidence.
- Use only original, licensed, or clearly synthetic media whose provenance is recorded. Do not copy third-party film imagery, logos, music, or footage into the repository or demo.

Create `docs/technology-compliance.md` containing:

1. the table above with exact resolved versions, official package links, deployment resource names, and runtime proof;
2. a dependency allowlist for all direct Python and JavaScript dependencies;
3. a direct-dependency denylist for prohibited AI SDKs/frameworks;
4. an architecture trace showing `browser → Cloud Run API → ADK/Agent Builder → official mcp-clickhouse → ClickHouse`;
5. commands that prove the hosted app, Gemini-on-Vertex invocation, ADK agent, MCP server, and ClickHouse query are live.

Add a CI check named `check-ai-compliance` that inspects direct dependencies, imports, environment-variable names, container definitions, and source configuration. It must fail if a prohibited AI vendor or agent framework is introduced, if Gemini is configured outside Vertex AI for production, or if the official MCP integration is removed. Avoid naive substring matching of transitive lockfile metadata; report the exact direct dependency/import/configuration that caused failure.

Stage One release gate: the submission is blocked unless all of these can be demonstrated from a clean checkout:

- new original project created during the contest period;
- installable and consistently runnable web app;
- hosted project URL;
- Gemini model call through Vertex AI;
- Google ADK agent built as part of Vertex AI Agent Builder;
- official `mcp-clickhouse` active at runtime against a real ClickHouse cluster;
- ClickHouse and Google Cloud services imported/configured **and actually called** in code;
- public repository with all source, assets, setup/run/test instructions, and a visible OSI-approved license permitting commercial use;
- original/licensed data and media provenance;
- public English demo video no longer than three minutes;
- submission text listing functionality, technologies, data sources, findings, and learnings.

## 3. Users, buyer, and product boundary

Primary users: audience researchers, editors, trailer editors, creative executives, and independent filmmakers.

Economic buyers: studios, streamers, trailer agencies, screening vendors, and advertising creative teams.

Initial beachhead: independent filmmakers and trailer teams testing two short cuts remotely.

Product boundaries:

- Collect only explicit consented reactions, surveys, and ordinary playback events: play, pause, seek, rewind, replay, skip, complete, and abandon.
- Never use webcams, microphones, facial analysis, gaze tracking, inferred emotion, biometrics, or dark-pattern consent.
- Use pseudonymous viewer IDs and aggregate results. Never show a named individual’s response path.
- Enforce minimum cohort size `k >= 10` before segment results are displayed. Return `INSUFFICIENT_SAMPLE`, not a fabricated conclusion.
- Label synthetic and simulated results prominently. Never present seeded uplift as real customer evidence.
- Agent conclusions are hypotheses, not causal facts. Allow `SUPPORTED`, `REJECTED`, and `INCONCLUSIVE` outcomes.

## 4. Build the decisive first cut

Prioritize one polished vertical slice over broad unfinished functionality. Implement these routes:

### `/`

Project list with `Northlight` seeded as the demo project. Show cut status, session count, latest finding, and experiment state.

### `/screen/:screeningToken`

Consent-first screening player for Cut A or Cut B. Include:

- Plain-language consent and data-use summary before playback.
- Original fictional scene video or a generated local placeholder that the team owns.
- Playback instrumentation using monotonic client timestamps plus canonical `media_time_ms`.
- Explicit reaction buttons: `Engaged`, `Confused`, `Funny`, `Too slow`.
- Post-scene survey.
- Event batching, retry with idempotency keys, and visible completion state.

### `/projects/:projectId/experiments/:experimentId`

Reproduce the premium editorial-workstation character of the MomentLab concept image:

- Near-black/graphite UI, compact professional typography, electric violet cohort lines, coral response-cliff marks, acid-lime approvals, warm off-white text.
- Top navigation and project/cut selector.
- Left: synchronized scene player and scene timeline.
- Center: completion, rewatch, confused, and engaged metric cards; cohort chips `All`, `18–24`, `25–34`; time-aligned response chart; highlighted response cliff at `00:37`; Cut A vs. Cut B comparison.
- Right: agent hypothesis, confidence with calibration language, evidence list, recommended action, human approval gate, and live `CLICKHOUSE MCP` activity panel.
- The central demo hypothesis is: `Move reveal 6 seconds earlier.` Treat it as a seeded demonstration result, not a universal creative recommendation.
- Every meaningful state needs loading, empty, insufficient-sample, tool-error, approval-required, and success variants.
- Meet WCAG 2.2 AA basics: keyboard navigation, semantic landmarks, focus visibility, chart text alternatives, reduced-motion support, contrast, and touch targets.
- Do not use a static screenshot as the interface. Rebuild the experience in accessible React components and charts.

#### UI/UX reference is a build specification

Treat the published MomentLab Idea Lab page and mockup as the authoritative visual/product target:

- Local product blueprint: `idea-lab/index.html`
- Full-resolution interface reference: `design/reference-originals/momentlab-desktop.png`
- Canonical desktop reference asset: `design/reference-originals/momentlab-desktop.png`
- Canonical mobile reference asset: `design/reference-originals/momentlab-mobile.png`
- Complete screen-level implementation pack: `momentlab-reference-pack/README.md`
- Antigravity execution sequence: `momentlab-reference-pack/HANDOFF.md`

At project initialization, open `momentlab-reference-pack/README.md`, inspect all 14 assets in place, and create a route-to-reference checklist before implementing the shell. Record the reviewed assets and review date in `design/reference-review.md`. **Do not design or implement a mobile view until `momentlab-reference-pack/mobile/09-mobile-finding.png`, `momentlab-reference-pack/mobile/10-mobile-evidence.png`, and `momentlab-reference-pack/mobile/11-mobile-test.png` have been successfully opened and inspected. If an asset is unavailable, stop and report the missing file; do not infer, improvise, or generate a replacement mobile design.** Treat `momentlab-reference-pack/system/12-design-system-board.png` and `momentlab-reference-pack/system/13-state-reference-board.png` as release specifications. Do not ship any reference image as the app UI or a background image. Reconstruct every route with accessible components and live data.

Match the reference’s information architecture and visual hierarchy:

- At a 1568 × 1000 desktop viewport, render a 60 px global header followed by a dense three-column workspace with approximately `31% / 46% / 23%` column proportions and 8–12 px gutters.
- Header: `MOMENTLAB` wordmark, `PROJECT NORTHLIGHT` selector, `IDEA LAB`, active `EXPERIMENTS`, `AUDIENCES`, `INSIGHTS`, `ASSETS`, agent status, notifications, settings, and user avatar.
- Left column: scene header, 16:9 player, transport/timecode, scene notes, thumbnail filmstrip with the `00:37` playhead, and experiment metadata.
- Center column: four metric cards, cohort and time-window controls, the dominant multi-series response chart, coral response-cliff annotation, proposed-experiment area, side-by-side Cut A/Cut B timelines, and expected-impact summary.
- Right column: edit hypothesis, confidence and rationale, lime `CREATE A/B TEST` action, human-approval card, and connected ClickHouse MCP activity card.
- Preserve the restrained professional-editor aesthetic: no glassmorphism, oversized consumer cards, neon glow, decorative gradients, emoji, or generic admin-dashboard styling.

Start with these design tokens, then adjust only when visual comparison or accessibility requires it:

```css
--canvas: #080b0e;
--surface-1: #0c1115;
--surface-2: #11171c;
--border: #202a31;
--text: #f1f3f2;
--muted: #8d979f;
--violet: #8b5cf6;
--violet-soft: #c4a7ff;
--lime: #b7e33d;
--coral: #ff6652;
--success: #58c94b;
--radius: 4px;
```

Use a compact sans-serif UI family with tabular numerals and a condensed treatment for labels. Default body text is 12–14 px, section labels 10–11 px uppercase with tracking, key metrics 26–32 px, and the brand 24–28 px. Maintain strong contrast and allow browser zoom; do not lock text into a canvas.

Required interactions:

- Scrubbing the scene filmstrip, player, or response chart keeps all three synchronized to `media_time_ms`.
- Hover/focus on the response chart produces a crosshair and accessible tooltip with time, cohort, sample size, value, and uncertainty.
- Cohort chips and `10S / 30S / 1M` windows update live ClickHouse-backed data and URL query state.
- Selecting the `00:37` anomaly highlights the matching frames, evidence, query trail, and hypothesis rationale.
- `PREVIEW BOTH` toggles synchronized Cut A/Cut B playback.
- `CREATE A/B TEST` creates a draft only. `APPROVE & LAUNCH` remains locked until an authenticated reviewer records approval.
- The MCP card streams real server-side tool activity over SSE and lets a judge inspect a sanitized query summary.

Responsive behavior:

- `>= 1280 px`: reference-faithful three-column workspace.
- `900–1279 px`: two-column player/analysis layout; the hypothesis/approval rail becomes an accessible side panel.
- `< 900 px`: implement the three-screen mobile workflow specified below and shown in `design/reference/momentlab-mobile.png`. Do not invent a generic one-column collapse of the desktop dashboard.

#### Mobile UI/UX reference is equally authoritative

The mobile reference shows three linked application states inside a real phone viewport. Build those states as responsive routes or URL-addressable tabs within the same application and shared data model:

```text
/projects/:projectId/experiments/:experimentId/finding
/projects/:projectId/experiments/:experimentId/evidence
/projects/:projectId/experiments/:experimentId/test
```

At mobile widths, provide a persistent three-item bottom navigation labeled exactly `Finding`, `Evidence`, and `Test`. It must preserve the user’s selected cohort, chart window, current `media_time_ms`, experiment ID, and agent-run state when navigating between tabs. Use real routing/history so Android back, iOS back gestures, deep links, refresh, and browser back work correctly. Do not implement the reference as three disconnected mock screens.

**Mobile screen 1 — Finding**

- Compact `MOMENTLAB` header, `PROJECT NORTHLIGHT` selector, and notification control.
- Scene header followed by the original-cut 16:9 player, transport controls, and `00:37 / 02:18` timecode.
- A single four-column metric row in this order: `COMPLETION 68%`, `REWATCH 24%`, `CONFUSED 12%`, `ENGAGED 72%`. At very narrow widths preserve legibility using equal compact cells; do not turn these into oversized stacked cards.
- Touch-friendly `ALL`, `18–24`, and `25–34` segment chips.
- The response chart remains the dominant mobile element, with the violet cohort series, coral `00:37` marker, and an anchored `RESPONSE CLIFF` callout showing `−28%` and `00:33–00:41`.
- The chart must support touch scrubbing, keyboard focus, accessible values, and synchronization with the video timecode.
- Bottom navigation has `Finding` active in violet.

**Mobile screen 2 — Evidence**

- Header and page title `MOMENT EVIDENCE`.
- Horizontally scrollable, snap-aligned scene filmstrip centered on the selected `00:37` frame; scrolling it updates the canonical media time.
- `COHORT COMPARISON` card with the three violet series and the exact cliff summary `−28% / 00:33–00:41`.
- `EDIT HYPOTHESIS` card with prominent `MOVE REVEAL 6S EARLIER`, supporting explanation, `CONFIDENCE 91%`, rationale bullets, evidence ID, and sample size.
- Live `CLICKHOUSE MCP` card marked `CONNECTED` only when the authenticated SSE tool stream is healthy. Show recent query purposes and durations using sanitized telemetry—not decorative hard-coded rows.
- Bottom navigation has `Evidence` active in violet.

**Mobile screen 3 — Test**

- Header and page title `CREATE A/B TEST`.
- Vertically stacked, full-width comparison cards: `CUT A (CONTROL)` with reveal at `00:43`, then `CUT B (VARIANT)` with reveal at `00:37` and `Move reveal 6s earlier`.
- Each cut card includes the same compact filmstrip/timeline treatment seen in the reference. `PREVIEW BOTH` may be available from an overflow action but must not displace the comparison.
- `EXPECTED IMPACT` row in this order: `ENGAGEMENT LIFT +18%`, `COMPLETION LIFT +9%`, `CONFUSED CHANGE −4%`.
- `HUMAN APPROVAL` card showing the current reviewer and an explicit `I approve this test` control.
- Full-width acid-lime `APPROVE & LAUNCH` action and secondary `SAVE DRAFT`. The launch action is disabled until server-confirmed authorization and approval; visual state alone is never sufficient.
- Privacy footer: `All insights use aggregated consented responses. No biometrics.`
- Bottom navigation has `Test` active in violet.

Mobile implementation invariants:

- Match the reference’s ordering, density, language, icon placement, color hierarchy, and compact professional feel. Do not replace the reference with carousels, accordions, hamburger navigation, floating action buttons, consumer-style cards, or a new design system.
- Use reusable desktop/mobile components and the same APIs; do not fork business logic or hard-code the reference values outside deterministic demo fixtures.
- Minimum touch target is 44 × 44 CSS px. Support safe-area insets, portrait orientation, text zoom, reduced motion, and a sticky bottom navigation that never obscures actions or content.
- Mobile charts may simplify axis labels but must retain all evidence needed to understand the anomaly. They must not become screenshots, canvases without accessible fallbacks, or horizontally clipped desktop charts.
- At tablet width, transition deliberately between the mobile tab flow and two-column layout; do not render both navigations simultaneously.

Visual acceptance is release-blocking:

1. Add a Storybook or equivalent route with deterministic states for default, loading, empty, insufficient sample, MCP failure, awaiting approval, test running, supported, rejected, and inconclusive.
2. Add Playwright screenshot tests at 1568 × 1000, 1280 × 800, and 1024 × 768 for desktop/tablet. Add separate 390 × 844 screenshots for the `Finding`, `Evidence`, and `Test` routes, plus 430 × 932 coverage for large phones.
3. Compare the desktop screenshot side by side with `design/reference/momentlab-concept.png`. Separately compare all three 390 × 844 mobile route screenshots with their corresponding phone screen in `design/reference/momentlab-mobile.png`. Create `docs/visual-qa.md` with distinct `Desktop` and `Mobile` sections listing discrepancies in layout, hierarchy, typography, spacing, color, content density, navigation, interaction state, and reference fidelity.
4. Iterate until there are no high-severity discrepancies, no overlap/clipping, no missing reference region, and no accessibility violation. A raw pixel threshold is not sufficient; use semantic visual review because live charts and fonts vary.
5. Save the final verified desktop screenshot to `docs/images/momentlab-built.png` and the verified mobile screenshots to `docs/images/momentlab-mobile-finding.png`, `docs/images/momentlab-mobile-evidence.png`, and `docs/images/momentlab-mobile-test.png` for the README and submission evidence.

### `/admin/demo`

A clearly marked demo-control page that can reset and reseed the deterministic dataset, inject the `00:37` anomaly, simulate Cut B results, and inspect system health. Protect it outside local/demo environments.

## 5. Technical architecture

Use a monorepo with these boundaries unless the existing environment requires a justified equivalent:

```text
momentlab/
  apps/web/              # TypeScript React web application
  services/api/          # Python FastAPI ingestion and product API
  services/agent/        # Python Google ADK agent and deterministic tools
  services/mcp/          # deployment config for official mcp-clickhouse; do not fork its logic
  packages/contracts/    # generated JSON Schema/OpenAPI types
  clickhouse/             # versioned DDL, views, seed queries
  simulator/              # deterministic audience-session generator
  infra/                  # Terraform and deployment scripts
  tests/                  # integration, evaluation, and end-to-end tests
  docs/                   # architecture, threat model, compliance, demo script
```

Preferred runtime shape:

- **Web:** React + TypeScript, deployed on Cloud Run. Use a mature accessible chart library; do not generate chart SVG strings manually.
- **API:** FastAPI on Cloud Run for screening tokens, ingestion, project reads, approvals, and experiment commands.
- **Agent:** Google ADK in Python, powered by a current generally available Gemini model on Vertex AI. Require `GEMINI_MODEL` in configuration. During setup, query current official Google documentation/model listings, select a GA model available in the chosen region, verify it with a minimal invocation, record the exact ID and verification date in `docs/decisions.md`, and pin dependencies. Do not guess or silently fall back to a preview/retired model.
- **Agent deployment:** Vertex AI Agent Engine is the preferred managed agent runtime. If a documented incompatibility prevents the first cut, deploy the ADK service to Cloud Run, document the blocker, and preserve a clean path to Agent Engine. Do not claim Agent Engine deployment unless it actually succeeds.
- **Analytics:** ClickHouse Cloud for event-time queries, cohort slicing, materialized views, and experiment history.
- **Required agent tool:** official `mcp-clickhouse`, deployed with authenticated HTTP transport. Keep it read-only in production: `CLICKHOUSE_ALLOW_WRITE_ACCESS=false`; never allow `DROP`.
- **Ingestion:** direct official ClickHouse client from the API for validated event writes. MCP is for agent investigation, not arbitrary browser writes.
- **Media:** Cloud Storage with signed URLs and restrictive CORS.
- **Events:** For the first cut, use synchronous idempotent ClickHouse inserts from the API so the critical path is deterministic. Document Pub/Sub as a post-hackathon scale path; do not provision or claim it unless it is actually implemented and tested.
- **Secrets:** Secret Manager; no `.env` secrets in source control.
- **Operations:** Cloud Logging, Cloud Trace, Error Reporting, health/readiness endpoints, structured correlation IDs, and budget alerts.
- **Delivery:** Artifact Registry, Cloud Build, Terraform, and repeatable `gcloud` scripts.

Create `docs/architecture.md` with a Mermaid context diagram and sequence diagrams for event ingestion, agent investigation, approval, and evaluation.

## 6. ClickHouse data design

Create reviewed, versioned DDL with appropriate ClickHouse types, codecs, partitioning, retention, and ordering. At minimum model:

- `projects`
- `cuts`
- `scene_moments`
- `screening_sessions`
- `audience_events`
- `survey_responses`
- `experiments`
- `experiment_assignments`
- `agent_runs`
- `approval_events`

For the primary event table, begin with this access pattern and refine it based on measured queries:

```text
PARTITION BY toYYYYMM(event_time)
ORDER BY (project_id, cut_id, cohort_id, session_id, media_time_ms, event_time)
```

Requirements:

- UUID or stable string identifiers; UTC timestamps; integer `media_time_ms`; explicit schema version.
- Idempotency key and deduplication strategy for client retries.
- Low-cardinality types where justified, not indiscriminately.
- Materialized views or projections for time buckets, cohort counts, completion funnels, rewind/rewatch density, and explicit reaction rates.
- Retention policy for raw events and longer-lived aggregates.
- Every query must filter by project and authorized tenant context.
- Parameterize application queries. The agent may only call allowlisted read-only MCP tools. Validate generated SQL or constrain the agent to approved query templates/views.
- Add realistic query fixtures and `EXPLAIN`/timing notes for the demo-critical queries.

The MCP activity panel must be backed by actual server-side tool telemetry—not hard-coded animation. Use this server-side event contract and stream it over the authenticated agent-run SSE endpoint:

```text
event_id, run_id, sequence, timestamp_utc, server="mcp-clickhouse",
tool_name, purpose, status, duration_ms, row_count,
query_fingerprint, result_columns, error_code?, redacted=true
```

Never send credentials, raw bearer headers, full SQL containing user-provided values, or result rows to the browser. `query_fingerprint` is a stable hash; the UI may show a separately generated allowlisted query summary.

## 7. Agent behavior

Implement one focused `FlowAnalystAgent` before considering multiple agents. Give it a strict system instruction and typed tools:

1. `get_experiment_context(project_id, experiment_id)`
2. `query_response_timeline(...)` through official ClickHouse MCP
3. `compare_cohorts(...)` through official ClickHouse MCP
4. `compare_cuts(...)` through official ClickHouse MCP
5. `get_scene_context(start_ms, end_ms)`
6. `draft_edit_hypothesis(evidence_ids)`
7. `create_experiment_draft(...)` — draft only
8. `evaluate_experiment(...)`

Agent policy:

- Use deterministic anomaly detection before generative explanation.
- Never infer protected traits or emotions.
- Never expose session-level personal behavior.
- Cite evidence IDs and query run IDs adjacent to every factual claim.
- Distinguish observation, inference, hypothesis, and recommendation.
- State sample size, effect size, uncertainty, and known confounders.
- Do not create or launch an experiment without an authenticated human approval event.
- Tool timeouts, malformed responses, small samples, contradictory cohorts, and missing scene context must produce bounded failure states.
- Limit tool turns and token budget. Retry transient tool failures with bounded exponential backoff; do not loop indefinitely.
- Store sanitized agent traces and evaluation results, but not chain-of-thought.

Use structured output validated by Pydantic. Define an `EditHypothesis` contract containing:

```text
hypothesis_id, status, observation, proposed_change, rationale,
evidence_ids, query_run_ids, affected_time_range_ms, cohorts,
sample_sizes, effect_sizes, uncertainty, confounders,
success_metric, guardrail_metrics, approval_required
```

## 8. Deterministic demo and evaluation harness

Build a seeded simulator with a fixed RNG seed that creates 1,000 pseudonymous screening sessions across:

- Cut A and Cut B
- Cohorts `18–24`, `25–34`, and `35+`
- Natural variation in completion, pauses, rewinds, seeking, and explicit reactions
- A known engagement cliff from approximately `00:33–00:41`, centered at `00:37`
- A larger Cut A effect in one cohort
- A Cut B variant in which the reveal moves six seconds earlier and produces a known simulated improvement

Keep a ground-truth file outside the agent prompt/context. The evaluator may read it; the agent may not.

Create `tests/evaluation/score_run.py`. It must join predicted anomaly intervals to hidden ground-truth intervals by experiment ID, compute intersection-over-union, true/false positives, precision, recall, F1, center-point localization error in milliseconds, cohort classification accuracy, and bootstrap 95% confidence intervals using a fixed evaluation seed. It must separately validate every cited evidence ID and MCP query-run ID against stored records. CI writes a machine-readable `evaluation-results.json` and a human-readable `evaluation-report.md`; the agent runtime cannot read the ground-truth directory.

Implement and report:

- anomaly precision, recall, and time localization error
- cohort-split detection accuracy
- MCP tool-call success rate and p50/p95 duration
- query row counts and p50/p95 latency
- evidence citation validity
- hypothesis-schema validity
- human-review agreement on a small rubric
- time from detected anomaly to approved experiment draft
- Variant B change in completion and engagement, with confidence interval and guardrails
- rate of `INCONCLUSIVE` decisions on deliberately underpowered tests

Targets are goals, never fabricated results:

- seeded anomaly localization error <= 2 seconds
- evidence citation validity = 100%
- structured output validity = 100%
- no cohort result below `k = 10`
- no experiment launch without approval
- demo-critical ClickHouse query p95 <= 1.5 seconds on the seeded dataset
- end-to-end happy path completes in <= 90 seconds during the demo

Add unit tests, ClickHouse integration tests, MCP contract tests, agent evaluation cases, API authorization tests, and Playwright end-to-end tests. Include adversarial cases for prompt injection in transcript text, SQL/tool misuse, cross-project access, replayed ingestion, tiny cohorts, and contradictory evidence.

## 9. API and state contracts

Define OpenAPI-first typed endpoints, including:

- `POST /v1/screenings/{token}/events:batch`
- `POST /v1/screenings/{token}/survey`
- `GET /v1/projects/{project_id}/experiments/{experiment_id}`
- `POST /v1/projects/{project_id}/experiments/{experiment_id}:investigate`
- `POST /v1/projects/{project_id}/experiments/{experiment_id}:approve`
- `POST /v1/projects/{project_id}/experiments/{experiment_id}:evaluate`
- `GET /v1/agent-runs/{run_id}/events` using SSE for visible progress
- `GET /healthz` and `GET /readyz`

Use explicit finite states:

```text
DRAFT → COLLECTING → READY_FOR_ANALYSIS → INVESTIGATING →
HYPOTHESIS_READY → AWAITING_APPROVAL → TEST_RUNNING →
SUPPORTED | REJECTED | INCONCLUSIVE | FAILED
```

Reject illegal transitions server-side. Approval requests require authentication, CSRF protection where applicable, idempotency, and an immutable audit event.

## 10. Security, privacy, and cost controls

Create `docs/threat-model.md` covering assets, trust boundaries, attackers, abuse cases, and mitigations. Implement:

- least-privilege service accounts per runtime
- authenticated private service-to-service calls
- separate read-only ClickHouse user for MCP and narrowly scoped write user for ingestion
- Secret Manager references, key rotation notes, and log redaction
- strict CORS, CSP, secure headers, input size/rate limits, upload validation, and signed media URLs
- tenant/project authorization on every API and query
- prompt-injection defense: transcript and survey text are untrusted data, never instructions
- bounded agent tools and query timeouts
- deletion/export flow for screening data and documented retention
- no secrets, emails, raw tokens, or individual response paths in traces
- Cloud Billing budget alerts, max Cloud Run instances, request timeouts, ClickHouse quotas, and simulator size caps

Provide a demo mode that uses pseudonymous synthetic data without weakening production authorization defaults.

Document environment-specific security headers and test them. Production defaults must include HSTS after HTTPS verification; `X-Content-Type-Options: nosniff`; `Referrer-Policy: strict-origin-when-cross-origin`; restrictive `Permissions-Policy`; frame protection via CSP `frame-ancestors`; and a nonce- or hash-based CSP that allows only the exact origins used by the deployed app. Do not copy a hard-coded CSP that breaks Cloud Storage media or encourages broad `unsafe-inline`/`unsafe-eval` exceptions.

## 11. Delivery plan

Work in four vertical milestones and keep the app runnable after each:

### Milestone 1 — Film and events

Create the monorepo, screening player, consent, event contract, ClickHouse DDL, ingestion, seed media, and deterministic simulator. Prove events align to timecode.

### Milestone 2 — ClickHouse and visible MCP

Implement aggregates, deploy/run official `mcp-clickhouse`, connect the ADK tool client, and render the real response timeline and real MCP activity. Prove the seeded cliff is retrieved from ClickHouse.

### Milestone 3 — Agent and approval

Implement deterministic detection, Gemini explanation, typed hypothesis, evidence citations, server-enforced approval, and experiment draft. Prove no approval can be bypassed.

### Milestone 4 — Evaluation, polish, and GCP

Implement Cut B evaluation, failure states, accessibility, security tests, observability, Terraform/Cloud Build, hosted deployment, public-repo documentation, and the submission video script.

At the end of each milestone:

1. Run format, lint, type-check, unit, integration, and relevant e2e tests.
2. Report what actually passed, failed, or remains mocked.
3. Update `docs/progress.md`, `docs/compliance-matrix.md`, and `docs/decisions.md`.
4. Commit a coherent checkpoint only if repository writes are authorized.

## 12. Google Cloud deployment deliverables

Prepare idempotent infrastructure and scripts for a configurable project, region, and domain. Do not embed project IDs.

Deliver:

- `infra/terraform` for service accounts, IAM, Artifact Registry, Cloud Run services, Pub/Sub if used, Cloud Storage, Secret Manager bindings, logging/monitoring, and budget guidance
- documented ClickHouse Cloud setup and least-privilege users
- container definitions with non-root users, health checks, pinned base images, and `.dockerignore`
- `cloudbuild.yaml` with tests before deploy
- database migration/DDL command that is safe to rerun
- MCP deployment with authenticated HTTP transport, secret injection, read-only ClickHouse access, and non-public ingress where supported
- Agent Engine deployment source/config and verification command; use Cloud Run fallback only when documented
- smoke-test script that exercises health, ingestion, MCP investigation, approval protection, and the happy path
- rollback procedure and cleanup script to avoid surprise cost
- `.env.example` containing names only, never values

After deployment, record actual URLs and resource names in an ignored local deployment manifest. Do not commit secrets. Verify the hosted build from a clean browser session.

## 13. Hackathon submission assets

Create:

- `README.md` leading with the problem, the detect-to-evaluate loop, architecture, setup, live app, demo credentials, tests, and explicit ClickHouse MCP proof
- root `LICENSE` using Apache-2.0 unless the owner chooses another OSI-approved commercial-use license
- `docs/submission.md` containing features, technologies, data sources, findings, limitations, and learnings
- `docs/demo-script.md` for a <= 3-minute video:
  - 0:00–0:20 — costly editorial uncertainty
  - 0:20–0:45 — consented screening signals and two cuts
  - 0:45–1:25 — agent detects `00:37`, visibly calls ClickHouse MCP, and compares cohorts
  - 1:25–1:55 — evidence-backed `Move reveal 6 seconds earlier` hypothesis
  - 1:55–2:15 — human approval creates the A/B test
  - 2:15–2:40 — Variant B evaluation and uncertainty
  - 2:40–3:00 — architecture, measured evaluation, partner indispensability, and impact
- `docs/judge-proof.md` mapping each equal-weight judging criterion—technological implementation, design, potential impact, and quality of idea—to concrete evidence in the product and video
- one-command local demo and one-command deterministic reset

The required commands are repository scripts, not prose placeholders:

```text
make demo        # validates prerequisites, starts local dependencies, applies DDL, seeds data, runs smoke tests, prints URLs
make reset-demo  # confirms the target is the named local/demo database, then safely reseeds the fixed dataset
make verify      # format/lint/type/unit/integration/evaluation/e2e checks
make deploy      # explicit confirmation, then tested GCP deployment using configured project and region
make smoke       # tests the deployed URL and required ClickHouse MCP path
```

Provide PowerShell equivalents for Windows contributors. `make demo` must never run Terraform against GCP or mutate production resources.

## 14. Definition of done

Do not call the first cut complete until all of these are true:

- A new viewer can consent, watch, react, and submit events.
- Events land in ClickHouse and appear in real timeline queries.
- The official ClickHouse MCP server is called at runtime by the ADK agent.
- The MCP activity panel reflects real sanitized tool telemetry.
- The agent locates the seeded `00:37` cliff without access to ground truth.
- The agent returns a valid, cited, uncertainty-aware edit hypothesis.
- A human approval is required and audited before the experiment begins.
- Cut B results can be evaluated as supported, rejected, or inconclusive.
- Loading, empty, insufficient-sample, failure, and retry states work.
- Cross-project access, prompt injection, duplicate events, and approval bypass tests fail safely.
- The interface is responsive, keyboard usable, and visually close to the supplied MomentLab product direction.
- The repository can be installed from its documented instructions and has an OSI-approved license.
- The deployed GCP app passes smoke tests from a clean session.
- The compliance matrix points to real runtime evidence, not claims.

## 15. Operating protocol for this build session

Start now.

1. Inspect the current workspace and preserve any existing compatible work.
2. Read and verify against these primary sources before choosing versions or architecture: the current hackathon rules at `https://agentic-cinema.devpost.com/rules`; Vertex AI Agent Builder overview at `https://cloud.google.com/vertex-ai/generative-ai/docs/agent-builder/overview`; Vertex AI Agent Engine documentation at `https://cloud.google.com/vertex-ai/generative-ai/docs/reasoning-engine/overview`; Google ADK documentation at `https://google.github.io/adk-docs/`; and the official ClickHouse MCP repository at `https://github.com/ClickHouse/mcp-clickhouse`. Put links, access dates, applicable requirements, and any changed assumptions in `docs/sources.md`.
3. Produce a concise implementation plan and architecture decision record. Do not stop for approval unless a material irreversible choice or credential is required.
4. Scaffold the repository and implement Milestone 1 as a working vertical slice.
5. Continue milestone by milestone, running tests after each material change.
6. Prefer real integrations. If a credential is unavailable, implement a contract-faithful adapter and local integration test, clearly label the blocked live step, and provide the exact command the owner must run. Never disguise a mock as production.
7. Keep a visible checklist with `DONE`, `IN PROGRESS`, `BLOCKED`, and `NOT STARTED`.
8. When reporting completion, include only verifiable outcomes, commands to reproduce them, known limitations, remaining credential-dependent steps, and the next highest-leverage action.

The winning standard is not maximum feature count. It is a coherent, beautiful, production-credible product in which Gemini makes a bounded creative decision, ClickHouse MCP is visibly indispensable, a human controls consequential action, and the demo proves the result with reproducible evidence.
