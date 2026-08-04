# Google technology and partner policy

- Gemini through Vertex AI is the only model inference in product, tooling, evaluation, and optional paths.
- Google Agent Development Kit (`google-adk`) is the only agent framework.
- Use Vertex AI Agent Builder and Agent Engine when supported by the verified current documentation.
- ClickHouse is the selected partner. The agent must call the official `ClickHouse/mcp-clickhouse` server against the real event dataset at runtime.
- Keep model names configurable and select a currently generally available Gemini model only after checking official Google Cloud documentation for the deployment region.
- Record source URL, access date, decision, and changed assumption in `docs/sources.md`.

## Prohibited Agent & AI Denylist (Strictly Blocked)

The following are strictly prohibited across runtime, build scripts, evaluation, fallbacks, browser/server code, and notebooks:
1. **Non-Google AI Models & SDKs**: OpenAI (GPT-4/o1), Anthropic (Claude), Ollama, HuggingFace, Mistral, Cohere, or local LLMs.
2. **Non-Google Agent Frameworks**: LangChain, LlamaIndex, AutoGen, CrewAI, Haystack, Semantic Kernel, or custom agent orchestrators.
3. **Direct AI Studio / Gemini Developer Keys**: Direct API keys (`API_KEY`) as production inference path. Vertex AI credentials with Google Cloud Project ID are mandatory.
4. **Custom/Imitation MCP Servers**: Imitation ClickHouse MCP servers. The official `ClickHouse/mcp-clickhouse` package must be used.
5. **Biometric & Emotion Inference**: Webcams, microphones, facial analysis, gaze tracking, voice-stress, or inferred emotion detection.
6. **Unpermitted Partner Runtimes**: Runtime integrations from non-ClickHouse partner tracks.

