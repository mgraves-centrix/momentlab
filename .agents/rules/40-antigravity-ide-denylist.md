# Antigravity IDE Agent Denylist and Security Controls

This rule governs agent tool execution, terminal command permissions, and technology restrictions inside Antigravity IDE for MomentLab.

## 1. Terminal Command Denylist (Requires Explicit Bypass / User Approval)

The following terminal command patterns must NEVER be executed inside the sandbox without explicit user permission (`BypassSandbox: true`):

- **Remote Git Operations & Auth**: `git push`, `git fetch`, `git pull`, `gh auth`, `gh repo`, `gh pr` (requires sandbox bypass and network approval).
- **External Network Requests**: `curl`, `wget`, or HTTP requests to non-whitelisted external endpoints outside `localhost` / `127.0.0.1`.
- **System Administration & Package Install**: `sudo`, `su`, system-wide package managers (`brew install`, `apt-get`).
- **Destructive Data Operations**:
  - `DROP DATABASE`, `DROP TABLE`, `TRUNCATE`, or broad `DELETE` SQL commands.
  - `gcloud projects delete`, `gsutil rm -r`, `gcloud storage rm` targeting buckets or GCP resources.
  - KMS key destruction or Secret Manager secret deletion.
- **System File Modifications**: Modifying system files outside the workspace root (`/etc/`, `~/.ssh/`, `/usr/`, `/var/`).

## 2. Agent Framework & Technology Denylist

The agent must NEVER import, install, or generate code for:

- **Non-Google AI Models**: OpenAI SDK (`openai`), Anthropic SDK (`@anthropic-ai/sdk`), Ollama, HuggingFace (`transformers`), Mistral, Cohere, or local LLM runtimes.
- **Non-Google Agent Orchestrators**: LangChain (`langchain`), LlamaIndex (`llama-index`), AutoGen, CrewAI, Haystack, or Semantic Kernel.
- **Direct Developer API Keys**: `GEMINI_API_KEY` for direct AI Studio inference. All production AI inference MUST use Google Cloud Vertex AI credentials with a GCP Project ID.
- **Unpermitted MCP Servers**: Custom or fake ClickHouse MCP servers. The agent MUST use the official `ClickHouse/mcp-clickhouse` distribution.
- **Biometric Data Collection**: Code or dependencies that collect webcams, microphones, facial analysis, gaze tracking, voice stress, or emotion detection.
