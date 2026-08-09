import os
import json
# pyrefly: ignore [missing-import]
from google.antigravity import Agent, LocalAgentConfig, types
# pyrefly: ignore [missing-import]
from google.antigravity import policy

async def generate_hypothesis(project_id: str, experiment_id: str) -> dict:
    """Uses Google ADK and ClickHouse MCP to analyze data and generate a hypothesis."""
    
    # We will use uv to run the mcp-clickhouse server because the npm package doesn't exist
    # and uv was successfully installed in the previous step.
    mcp_servers = [
        types.McpStdioServer(
            command="/Users/mattgraves/.local/bin/uvx",
            args=["mcp-clickhouse"],
            env={
                "CLICKHOUSE_HOST": "localhost",
                "CLICKHOUSE_PORT": "8123",
                "CLICKHOUSE_USER": "default",
                "CLICKHOUSE_PASSWORD": "",
                "PATH": os.environ.get("PATH", "")
            }
        )
    ]
    
    config = LocalAgentConfig(
        mcp_servers=mcp_servers,
        model="gemini-1.5-pro",
    )
    
    prompt = f"""
You are an expert film editor and data analyst.
Please query the ClickHouse database using your MCP tools to analyze the telemetry_events table for project_id='{project_id}' and experiment_id='{experiment_id}'.
Look for media_time_ms ranges where there are significant drops in the average value or spikes in negative event types (e.g., 'CONFUSED', 'TOO SLOW', 'FUNNY' out of context).

Based on your analysis of the actual data, propose an editorial cut or modification.

Respond strictly in JSON format with the following keys:
- title: A short title for the hypothesis.
- description: A detailed description of the proposed edit and the reasoning based on the data.
- proposed_action: A concise action statement (e.g., "Cut the scene between 33s and 41s").
- evidence: A list of evidence items, each containing:
  - timestamp: The video timecode where the anomaly occurred (e.g., "00:33").
  - metric: A description of the metric (e.g., "Confusion spike").
  - query: The exact SQL query you executed to find this evidence.
"""
    
    async with Agent(config) as agent:
        response = await agent.chat(prompt)
        try:
            text = (await response.text()).strip()
            if text.startswith("```json"):
                text = text[7:-3]
            elif text.startswith("```"):
                text = text[3:-3]
            
            return json.loads(text.strip())
        except Exception as e:
            return {
                "title": "Agent Analysis Failed",
                "description": f"Agent responded with invalid JSON or encountered an error. Raw response: {await response.text()}",
                "proposed_action": "Review logs manually.",
                "evidence": []
            }
