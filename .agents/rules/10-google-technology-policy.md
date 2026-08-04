# Google technology and partner policy

- Gemini through Vertex AI is the only model inference in product, tooling, evaluation, and optional paths.
- Google Agent Development Kit (`google-adk`) is the only agent framework.
- Use Vertex AI Agent Builder and Agent Engine when supported by the verified current documentation.
- ClickHouse is the selected partner. The agent must call the official `ClickHouse/mcp-clickhouse` server against the real event dataset at runtime.
- Do not add another model provider, agent framework, partner-track runtime, hidden fallback, or optional noncompliant path.
- Keep model names configurable and select a currently generally available Gemini model only after checking official Google Cloud documentation for the deployment region.
- Record source URL, access date, decision, and changed assumption in `docs/sources.md`.
