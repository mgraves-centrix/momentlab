import os
import json
import logging
from dotenv import load_dotenv
from google.adk import Agent, Runner
from google.adk.sessions import InMemorySessionService
from google.adk.tools.mcp_tool import McpToolset
from mcp.client.stdio import StdioServerParameters
from google.genai.types import Content, Part

import time
import uuid
import logging
from dotenv import load_dotenv

# Ensure Vertex AI environment variables are set for google-genai
if not os.environ.get("GOOGLE_CLOUD_PROJECT"):
    os.environ["GOOGLE_CLOUD_PROJECT"] = os.environ.get("GCP_PROJECT_ID", "")
if not os.environ.get("GOOGLE_CLOUD_LOCATION"):
    os.environ["GOOGLE_CLOUD_LOCATION"] = os.environ.get("GCP_LOCATION", "us-central1")

async def generate_hypothesis(project_id: str, experiment_id: str) -> dict:
    """Uses Google ADK and ClickHouse MCP to analyze data and generate a hypothesis."""
    
    clickhouse_mcp = McpToolset(
        tool_name_prefix="clickhouse",
        connection_params=StdioServerParameters(
            command="uvx",
            args=["mcp-clickhouse"],
            env={
                "CLICKHOUSE_HOST": os.environ.get("CLICKHOUSE_HOST", "localhost"),
                "CLICKHOUSE_PORT": os.environ.get("CLICKHOUSE_PORT", "8123"),
                "CLICKHOUSE_USER": os.environ.get("CLICKHOUSE_MCP_USER", "momentlab_mcp_reader"),
                "CLICKHOUSE_PASSWORD": os.environ.get("CLICKHOUSE_MCP_PASSWORD", "mcp_password"),
                "CLICKHOUSE_SECURE": os.environ.get("CLICKHOUSE_SECURE", "false"),
                "PATH": os.environ.get("PATH", "")
            }
        )
    )
    
    puppeteer_mcp = McpToolset(
        tool_name_prefix="puppeteer",
        connection_params=StdioServerParameters(
            command="npx",
            args=["-y", "@modelcontextprotocol/server-puppeteer"],
            env={
                "PATH": os.environ.get("PATH", "")
            }
        )
    )
    
    instruction = """
You are an expert film editor and data analyst.
You must use your MCP tools to query the ClickHouse database and analyze the audience_events and reaction_events tables.
Look for media_time_ms ranges where there are significant drops in the average retention_score or spikes in negative event types (e.g., 'CONFUSED', 'BORED') for specific cohorts.
Based on your analysis of the actual data, propose an editorial cut or modification.

Respond strictly in JSON format with the following keys:
- id: A unique string identifier.
- proposedChange: A concise action statement (e.g., "Cut the scene between 33s and 41s").
- rationale: A detailed description of the proposed edit and the reasoning based on the data.
- confidenceScore: An integer between 0 and 100 representing confidence.
- forecastEngagement: A string estimating engagement lift (e.g., "+18%").
- forecastCompletion: A string estimating completion lift (e.g., "+9%").
- forecastConfusion: A string estimating confusion reduction (e.g., "-4%").
- evidenceIds: A list of strings representing evidence (e.g., ["query_1", "query_2"]).
- evidenceRecords: A list of evidence objects, each containing:
  - id: (e.g., "EV-1234")
  - timestamp: The video timecode where the anomaly occurred (e.g., "00:33").
  - metric: A description of the metric (e.g., "Confusion spike").
  - segment: (e.g., "ALL")
  - window: (e.g., "00:33-00:41")
  - effectSize: (e.g., "-28%")
  - significance: (e.g., "p < 0.01")
  - sourceQueryRunId: A unique string representing the query run.
- trace: An object containing:
  - runId: A unique string representing this agent run.
  - totalDurationMs: An integer representing total execution time.
  - steps: A list of objects containing name (e.g., "Deterministic Detector", "ClickHouse MCP Cohort Query", "Scene Context Retrieval", "Hypothesis Validation"), status (e.g., "success"), and durationMs.
- status: Must be "PROPOSED".
- isSimulated: Must be false.
"""
    
    # Initialize agent
    agent = Agent(
        name="momentlab_agent",
        model="gemini-2.5-pro",
        tools=[clickhouse_mcp, puppeteer_mcp],
        instruction=instruction
    )
    
    session_service = InMemorySessionService()
    await session_service.create_session(user_id="default", session_id="hypothesis_gen", app_name="momentlab")
    runner = Runner(agent=agent, session_service=session_service, app_name="momentlab")
    
    prompt = f"Please query the database for project_id='{project_id}' and experiment_id='{experiment_id}' and provide your hypothesis."
    content = Content(parts=[Part.from_text(text=prompt)])
    
    res = ""
    run_id = f"run_{uuid.uuid4().hex[:8]}"
    start_time = time.time()
    steps = []
    
    try:
        from google.adk.events import ToolCallEvent, ToolResponseEvent, ModelCallEvent, ModelResponseEvent
        
        step_start_time = time.time()
        current_step_name = "Agent Initialization"
        
        async for event in runner.run_async(user_id="default", session_id="hypothesis_gen", new_message=content):
            now = time.time()
            duration_ms = int((now - step_start_time) * 1000)
            
            if isinstance(event, ToolCallEvent):
                steps.append({
                    "name": current_step_name,
                    "status": "success",
                    "durationMs": duration_ms
                })
                current_step_name = f"Tool Call: {event.tool_name}"
                step_start_time = now
            elif isinstance(event, ToolResponseEvent):
                steps.append({
                    "name": current_step_name,
                    "status": "success",
                    "durationMs": duration_ms
                })
                current_step_name = "Evaluating Results"
                step_start_time = now
                
            logger.info(f"EVENT RECEIVED: type={type(event)} dict={event.__dict__ if hasattr(event, '__dict__') else 'N/A'}")
            if hasattr(event, "content") and event.content and hasattr(event.content, "parts"):
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
    except Exception as e:
        logger.error(f"Error during agent execution: {e}")
        return {
            "id": "error_1",
            "proposedChange": "Review backend logs.",
            "rationale": f"Failed to generate hypothesis. Error: {str(e)}",
            "confidenceScore": 0,
            "forecastEngagement": "+0%",
            "forecastCompletion": "+0%",
            "forecastConfusion": "+0%",
            "evidenceIds": [],
            "evidenceRecords": [],
            "trace": {
                "runId": "error_1_run",
                "totalDurationMs": 0,
                "steps": []
            },
            "status": "PROPOSED",
            "isSimulated": False
        }
            
    try:
        text = res.strip()
        if text.startswith("```json"):
            text = text[7:-3]
        elif text.startswith("```"):
            text = text[3:-3]
        
        parsed_res = json.loads(text.strip())
        
        # Override trace with real measured execution
        parsed_res["trace"] = {
            "runId": run_id,
            "totalDurationMs": int((time.time() - start_time) * 1000),
            "steps": steps
        }
        
        return parsed_res
    except Exception as e:
        logger.error(f"Failed to parse agent JSON output: {e}\nRaw output: {res}")
        return {
            "id": "error_2",
            "proposedChange": "Review logs manually.",
            "rationale": f"Agent responded with invalid JSON. Raw response: {res}",
            "confidenceScore": 0,
            "forecastEngagement": "+0%",
            "forecastCompletion": "+0%",
            "forecastConfusion": "+0%",
            "evidenceIds": [],
            "evidenceRecords": [],
            "trace": {
                "runId": "error_2_run",
                "totalDurationMs": 0,
                "steps": []
            },
            "status": "PROPOSED",
            "isSimulated": False
        }
