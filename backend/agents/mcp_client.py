import os
import json
import time
import uuid
import logging
from dotenv import load_dotenv

# Load environment variables from repo root .env
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
env_path = os.path.join(repo_root, ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

# Ensure Vertex AI environment variables are set for google-adk and google-genai
os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "true"
if os.environ.get("GCP_PROJECT_ID"):
    os.environ["GOOGLE_CLOUD_PROJECT"] = os.environ["GCP_PROJECT_ID"]
elif not os.environ.get("GOOGLE_CLOUD_PROJECT"):
    os.environ["GOOGLE_CLOUD_PROJECT"] = "momentlab-504305"

if os.environ.get("GCP_LOCATION"):
    os.environ["GOOGLE_CLOUD_LOCATION"] = os.environ["GCP_LOCATION"]
elif not os.environ.get("GOOGLE_CLOUD_LOCATION"):
    os.environ["GOOGLE_CLOUD_LOCATION"] = "us-central1"

from google.adk import Agent, Runner
from google.adk.sessions import InMemorySessionService
from google.adk.tools.mcp_tool import McpToolset, StdioConnectionParams
from mcp.client.stdio import StdioServerParameters
from google.genai.types import Content, Part
from google.adk.events import Event

logger = logging.getLogger("momentlab.agent.adk")

async def generate_hypothesis(project_id: str, experiment_id: str) -> dict:
    """Uses Google ADK and ClickHouse MCP to analyze data and generate a hypothesis."""
    
    clickhouse_host = os.environ.get("CLICKHOUSE_HOST", "localhost").strip()
    clickhouse_port = os.environ.get("CLICKHOUSE_PORT", "8443").strip()
    clickhouse_user = (os.environ.get("CLICKHOUSE_MCP_USER") or "").strip()
    if not clickhouse_user:
        raise ValueError("Missing required environment variable: CLICKHOUSE_MCP_USER")

    clickhouse_pass = (os.environ.get("CLICKHOUSE_MCP_PASSWORD") or "").strip()
    if not clickhouse_pass:
        raise ValueError("Missing required environment variable: CLICKHOUSE_MCP_PASSWORD")

    clickhouse_secure = os.environ.get("CLICKHOUSE_SECURE", "true" if clickhouse_port == "8443" else "false").strip().lower() in ("true", "1", "yes")
    clickhouse_db = os.environ.get("CLICKHOUSE_DATABASE", "momentlab").strip()

    clickhouse_mcp = McpToolset(
        tool_name_prefix="clickhouse",
        connection_params=StdioConnectionParams(
            server_params=StdioServerParameters(
                command="uvx",
                args=["mcp-clickhouse"],
                env={
                    "CLICKHOUSE_HOST": clickhouse_host,
                    "CLICKHOUSE_PORT": clickhouse_port,
                    "CLICKHOUSE_USER": clickhouse_user,
                    "CLICKHOUSE_PASSWORD": clickhouse_pass,
                    "CLICKHOUSE_SECURE": "true" if clickhouse_secure else "false",
                    "CLICKHOUSE_DATABASE": clickhouse_db,
                    "PATH": os.environ.get("PATH", "")
                }
            ),
            timeout=30.0
        )
    )
    
    instruction = """
You are an expert film editor and data analyst for MomentLab.
You must use your MCP tools to query the ClickHouse database and analyze the audience_events and reaction_events tables in the 'momentlab' database.
Look for media_time_ms ranges where there are significant drops in the average retention_score or spikes in negative event types for specific cohorts. Note: media_time_ms is in milliseconds (e.g. 33000 to 41000 for 33s-41s).
Based on your analysis of the actual data, propose an editorial cut or modification.

Respond strictly in valid JSON format with the following keys:
- id: A unique string identifier.
- proposedChange: A concise action statement (e.g., "Cut the scene between 33s and 41s" or "MOVE REVEAL 6S EARLIER").
- rationale: A detailed description of the proposed edit and the reasoning based on the data.
- confidenceScore: An integer between 0 and 100 representing confidence (must be > 0 for a valid proposal).
- forecastEngagement: A string estimating engagement lift (e.g., "+18%").
- forecastCompletion: A string estimating completion lift (e.g., "+9%").
- forecastConfusion: A string estimating confusion reduction (e.g., "-4%").
- evidenceIds: A list of strings representing evidence identifiers.
- evidenceRecords: A list of evidence objects, each containing:
  - id: (e.g., "ev_01" or "EV-1234")
  - timestamp: The video timecode where the anomaly occurred (e.g., "00:33" or "00:37").
  - metric: A description of the metric (e.g., "Retention drop" or "Confusion spike").
  - segment: (e.g., "ALL" or "18-24")
  - window: (e.g., "00:33-00:41")
  - effectSize: (e.g., "-28%")
  - significance: (e.g., "p < 0.01")
  - sourceQueryRunId: A unique string representing the query run.
- trace: An object containing:
  - runId: A unique string representing this agent run.
  - totalDurationMs: An integer representing total execution time.
  - steps: A list of objects containing name, status ("success"), and durationMs.
- status: Must be "PROPOSED".
- isSimulated: Must be false.
"""
    
    # Initialize agent
    agent = Agent(
        name="momentlab_agent",
        model="gemini-2.5-pro",
        tools=[clickhouse_mcp],
        instruction=instruction
    )
    
    session_service = InMemorySessionService()
    session_id = f"sess_{uuid.uuid4().hex[:8]}"
    await session_service.create_session(user_id="default", session_id=session_id, app_name="momentlab")
    runner = Runner(agent=agent, session_service=session_service, app_name="momentlab")
    
    prompt = f"Please query the ClickHouse database for project_id='{project_id}' and experiment_id='{experiment_id}' and provide your hypothesis."
    content = Content(parts=[Part.from_text(text=prompt)])
    
    res = ""
    run_id = f"run_{uuid.uuid4().hex[:8]}"
    start_time = time.time()
    steps = []
    
    step_start_time = time.time()
    current_step_name = "Agent Initialization"
    
    async for event in runner.run_async(user_id="default", session_id=session_id, new_message=content):
        now = time.time()
        duration_ms = int((now - step_start_time) * 1000)
        
        # Track tool calls
        function_calls = event.get_function_calls()
        if function_calls:
            for call in function_calls:
                steps.append({
                    "name": current_step_name,
                    "status": "success",
                    "durationMs": duration_ms
                })
                current_step_name = f"Tool Call: {call.name}"
                step_start_time = now
                
        # Track tool responses
        function_responses = event.get_function_responses()
        if function_responses:
            for resp in function_responses:
                steps.append({
                    "name": current_step_name,
                    "status": "success",
                    "durationMs": duration_ms
                })
                current_step_name = "Evaluating Results"
                step_start_time = now
            
        logger.info(f"EVENT RECEIVED: author={event.author} id={event.id}")
        if event.content and event.content.parts:
            for part in event.content.parts:
                if hasattr(part, "text") and part.text:
                    res += part.text
        elif hasattr(event, "output") and event.output:
            res = getattr(event.output, "text", res)
            
    # Final step
    steps.append({
        "name": current_step_name,
        "status": "success",
        "durationMs": int((time.time() - step_start_time) * 1000)
    })
        
    if not res:
        raise RuntimeError("Agent completed execution without returning output.")

    text = res.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    
    try:
        parsed_res = json.loads(text.strip())
    except Exception as e:
        logger.error(f"Failed to parse agent JSON output: {e}\nRaw output: {res}")
        raise ValueError(f"Agent generated invalid JSON output: {str(e)}") from e
    
    parsed_res["experimentId"] = experiment_id
    # Override trace with real measured execution
    parsed_res["trace"] = {
        "runId": run_id,
        "totalDurationMs": int((time.time() - start_time) * 1000),
        "steps": steps
    }
    
    return parsed_res
