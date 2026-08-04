# MomentLab Antigravity bootstrap

You are Gemini operating inside Google Antigravity. Implement MomentLab from an approved product, visual, compliance, and architecture specification. Do not begin by redesigning the interface or replacing the selected architecture.

## Required reading before implementation

1. `.agents/README.md` and every file under `.agents/rules/` (including `40-antigravity-ide-denylist.md`)
2. `MOMENTLAB-BUILD-PROMPT.md`
3. `UI-IMPLEMENTATION-CONTRACT.md`
4. `momentlab-reference-pack/README.md` and `momentlab-reference-pack/HANDOFF.md`
5. Every PNG under `momentlab-reference-pack/desktop`, `mobile`, and `system`

Execute one numbered file under `.agents/workflows/` at a time, starting with `.agents/workflows/00-audit-and-plan.md`. Do not attempt the master specification as one giant pass. Before each workflow, restate its exit gate; after it, report only verified artifacts and results.

## Non-negotiable behavior

- Reconstruct the references using accessible React components, real routes, typed APIs, and deterministic demo fixtures.
- Never ship a reference raster as UI or as a CSS background.
- Preserve the dedicated mobile Finding, Evidence, and Test flows plus their four-item bottom navigation. Do not invent a generic collapsed desktop view.
- Preserve evidence lineage through ClickHouse MCP and record tool/query identifiers.
- Keep Gemini-generated hypotheses advisory and approval-gated.
- Never collect or infer biometric, facial, gaze, voice-stress, or emotion-recognition data.
- Clearly identify synthetic footage and simulated results.

## Prohibited agent technology and terminal denylist

- **Blocked Terminal Operations (BypassSandbox Required)**: Never execute unapproved network commands (`git push`, `git fetch`, `gh`, `curl`, `gcloud`, `bq`), root/system commands (`sudo`, `brew install`), destructive database commands (`DROP DATABASE`, `DROP TABLE`, `TRUNCATE`), or edits outside `/Users/mattgraves/Development/momentlab`.
- **Prohibited AI Models & SDKs**: Never use OpenAI, Anthropic, Ollama, HuggingFace, Mistral, Cohere, or local LLMs. Gemini via Vertex AI is mandatory.
- **Prohibited Agent Frameworks**: Never use LangChain, LlamaIndex, AutoGen, CrewAI, Haystack, or Semantic Kernel. Google ADK (`google-adk`) is mandatory.
- **Direct AI Studio Keys**: Never use direct Gemini Developer API keys (`GEMINI_API_KEY`) for production inference. Vertex AI on GCP is mandatory.
- **Custom MCP Imitations**: Never use fake/custom ClickHouse MCP servers. The official `ClickHouse/mcp-clickhouse` distribution is mandatory.

If sources conflict, apply the authority order in `UI-IMPLEMENTATION-CONTRACT.md` and document any unresolved material conflict. Never silently change the product contract.

Your first response in a new workspace must identify the active workflow, list the governing files successfully read, report repository status, and state the exact artifacts you will produce. Then proceed unless a credential, billing choice, or irreversible action blocks safe work.
