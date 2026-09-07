import os
import re
import json
import time
import sys
import uuid
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from dotenv import load_dotenv

logger = logging.getLogger("momentlab.agents.mcp_client")
logger.setLevel(logging.INFO)
if not logger.handlers:
    _ch = logging.StreamHandler(sys.stdout)
    _ch.setLevel(logging.INFO)
    _ch.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))
    logger.addHandler(_ch)

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

try:
    from google.adk.tools import McpToolset
    from google.adk.tools.mcp_tool.mcp_toolset import StdioConnectionParams
    from mcp.client.stdio import StdioServerParameters
except ImportError:
    try:
        from google.adk.tools.mcp_tool import McpToolset, StdioConnectionParams
        from mcp.client.stdio import StdioServerParameters
    except ImportError:
        McpToolset = None
        StdioConnectionParams = None
        StdioServerParameters = None

from google.adk import Agent, Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from google.genai.types import Content, Part
from google.adk.events import Event

ALLOWED_MCP_TOOLS = ["run_query", "list_tables"]

def _extract_text_from_event(event) -> str:
    texts = []
    if getattr(event, "error_message", None):
        logger.error("Event error: %s", event.error_message)
    if event.content:
        parts = getattr(event.content, "parts", None)
        if parts:
            for part in parts:
                if hasattr(part, "text") and part.text:
                    texts.append(str(part.text))
                elif isinstance(part, dict) and "text" in part:
                    texts.append(str(part["text"]))
                elif isinstance(part, str):
                    texts.append(part)
        elif isinstance(event.content, dict) and "parts" in event.content:
            for part in event.content["parts"]:
                if isinstance(part, dict) and "text" in part:
                    texts.append(str(part["text"]))
                elif hasattr(part, "text") and part.text:
                    texts.append(str(part.text))
                elif isinstance(part, str):
                    texts.append(part)
        elif isinstance(event.content, str):
            texts.append(event.content)
    if hasattr(event, "text") and event.text:
        texts.append(str(event.text))
    if hasattr(event, "output") and event.output:
        if isinstance(event.output, str):
            texts.append(event.output)
        elif isinstance(event.output, dict):
            if "text" in event.output:
                texts.append(str(event.output["text"]))
        elif hasattr(event.output, "text"):
            texts.append(str(event.output.text))
    return "".join(texts)

def _is_data_query(q_dict: dict) -> bool:
    q_tables = [t.lower() for t in q_dict.get("tables", [])]
    q_text = (q_dict.get("query") or "").lower()
    data_targets = ["audience_events", "reaction_events", "retention_by_second", "reaction_anomalies"]
    has_target = any(any(dt in t for dt in data_targets) for t in q_tables) or any(dt in q_text for dt in data_targets)
    is_sys = any(t.startswith("system.") for t in q_tables) or "system.query_log" in q_text
    return has_target and not is_sys

def compute_grounding(run_queries: list) -> tuple[int, bool]:
    data_queries = [q for q in run_queries if _is_data_query(q)]
    return len(data_queries), len(data_queries) > 0

MAX_POLL_SECONDS = 15

async def generate_hypothesis(project_id: str, experiment_id: str) -> dict:
    """Uses Google ADK and ClickHouse MCP to analyze data and generate a hypothesis."""
    start_time = time.time()
    
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
        tool_filter=ALLOWED_MCP_TOOLS,
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
            timeout=60.0
        )
    )
    
    instruction = """
You are an expert film editor and data analyst for MomentLab.
You MUST use your ClickHouse MCP `run_query` tool to query the ClickHouse database (`momentlab` database) before generating your hypothesis.

DATABASE SCHEMA:
1. `momentlab.retention_by_second_aggregated` (Materialized Aggregating View for Retention):
   - `project_id` (String), `experiment_id` (String), `scene_id` (String)
   - `media_time_ms` (UInt32) - Video time in milliseconds.
   - `retention_avg` - State for avg. Use `avgMerge(retention_avg)` in queries.
   - `sample_size` - Sample count per time bucket. Use `sum(sample_size)`.

2. `momentlab.reaction_anomalies_aggregated` (Materialized Summing View for Reactions):
   - `project_id` (String), `scene_id` (String), `media_time_ms` (UInt32)
   - `confused_count`, `engaging_count`, `bored_count` - Use `sum(confused_count)`, etc.

3. `momentlab.audience_events`:
   - Raw playback events table (`project_id`, `experiment_id`, `scene_id`, `media_time_ms`, `retention_score`).

4. `momentlab.reaction_events`:
   - Raw reaction events table (`project_id`, `scene_id`, `media_time_ms`, `reaction_type`).

CLICKHOUSE SQL RULES & WORKED EXAMPLES:
- Prefer querying `momentlab.retention_by_second_aggregated` or `momentlab.reaction_anomalies_aggregated` or `momentlab.audience_events` / `momentlab.reaction_events`.
- Filter by `project_id` and `experiment_id` (or `scene_id`).
- Aggregate by media_time_ms to find retention cliffs or reaction spikes.

Example 1 (Audience Retention Drop using Materialized View):
SELECT
    media_time_ms AS sec_ms,
    avgMerge(retention_avg) AS avg_retention,
    sum(sample_size) AS sample_size
FROM momentlab.retention_by_second_aggregated
WHERE project_id = 'proj_northlight_01' AND experiment_id = 'exp_23a'
GROUP BY sec_ms
ORDER BY sec_ms ASC;

Example 2 (Reaction Spikes using Materialized View):
SELECT
    media_time_ms,
    sum(confused_count) AS confused,
    sum(engaging_count) AS engaging
FROM momentlab.reaction_anomalies_aggregated
WHERE scene_id = 'sc_12'
GROUP BY media_time_ms
ORDER BY confused DESC;

IMPORTANT: Run at least one valid SQL query using `run_query` against ClickHouse tables (`momentlab.retention_by_second_aggregated`, `momentlab.reaction_anomalies_aggregated`, `momentlab.audience_events`, or `momentlab.reaction_events`) to ground your analysis in real ClickHouse telemetry data.

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
- trace: An object containing:
  - runId: A unique string representing this agent run.
  - totalDurationMs: An integer representing total execution time.
  - steps: A list of objects containing name, status ("success"), and durationMs.
- status: Must be "PROPOSED".
- isSimulated: Must be true.
"""
    
    # Safety settings are explicit and deliberate, not defaults
    generate_content_config = types.GenerateContentConfig(
        safety_settings=[
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            ),
        ]
    )

    # Initialize agent
    agent = Agent(
        name="momentlab_agent",
        model="gemini-2.5-pro",
        tools=[clickhouse_mcp],
        instruction=instruction,
        generate_content_config=generate_content_config,
    )
    
    session_service = InMemorySessionService()
    session_id = f"sess_{uuid.uuid4().hex[:8]}"
    await session_service.create_session(user_id="default", session_id=session_id, app_name="momentlab")
    runner = Runner(agent=agent, session_service=session_service, app_name="momentlab")
    
    prompt = f"Please query the ClickHouse database for project_id='{project_id}' and experiment_id='{experiment_id}' and provide your hypothesis."
    content = Content(parts=[Part.from_text(text=prompt)])
    
    res = ""
    run_id = f"run_{uuid.uuid4().hex[:8]}"
    steps = []
    
    step_start_time = time.time()
    current_step_name = "Agent Initialization"
    
    captured_mcp_queries = []
    async for event in runner.run_async(user_id="default", session_id=session_id, new_message=content):
        now = time.time()
        duration_ms = int((now - step_start_time) * 1000)

        # Check for safety filter blocks or errors
        finish_reason_str = str(getattr(event, "finish_reason", "") or "").upper()
        if finish_reason_str in ("SAFETY", "BLOCKLIST", "PROHIBITED_CONTENT", "IMAGE_SAFETY", "IMAGE_PROHIBITED_CONTENT"):
            raise RuntimeError(f"Agent response was blocked by safety filter (finish_reason={finish_reason_str}).")
        if getattr(event, "error_message", None) and "safety" in str(event.error_message).lower():
            raise RuntimeError(f"Agent response was blocked by safety filter: {event.error_message}")
        
        # Track tool calls
        function_calls = event.get_function_calls()
        if function_calls:
            for call in function_calls:
                call_name = getattr(call, "name", "") or ""
                call_args = getattr(call, "args", {}) or {}
                steps.append({
                    "name": current_step_name,
                    "status": "success",
                    "durationMs": duration_ms
                })
                current_step_name = f"Tool Call: {call_name}"
                step_start_time = now

                if isinstance(call_args, dict) and "query" in call_args:
                    q_str = str(call_args["query"]).strip()
                    if q_str and q_str not in captured_mcp_queries:
                        captured_mcp_queries.append(q_str)
                
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
        ev_text = _extract_text_from_event(event)
        if ev_text:
            res += ev_text
            
    # Final step
    steps.append({
        "name": current_step_name,
        "status": "success",
        "durationMs": int((time.time() - step_start_time) * 1000)
    })
        
    if not res:
        session = await session_service.get_session(user_id="default", session_id=session_id, app_name="momentlab")
        if session and session.events:
            for ev in session.events:
                if getattr(ev, "author", None) != "user":
                    ev_text = _extract_text_from_event(ev)
                    if ev_text:
                        res += ev_text

    if not res:
        raise RuntimeError("Agent completed execution without returning output.")

    text = res.strip()
    match = re.search(r'(\{[\s\S]*\})', text)
    json_str = match.group(1) if match else text
    
    try:
        parsed_res = json.loads(json_str.strip())
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
    
    # 1. Build query records from captured MCP tool calls
    captured_query_objects = []
    for idx, sql in enumerate(captured_mcp_queries):
        tables = []
        sql_lower = sql.lower()
        if "audience_events" in sql_lower:
            tables.append("momentlab.audience_events")
        if "reaction_events" in sql_lower:
            tables.append("momentlab.reaction_events")
        if "retention_by_second" in sql_lower:
            tables.append("momentlab.retention_by_second_aggregated")
        if "reaction_anomalies" in sql_lower:
            tables.append("momentlab.reaction_anomalies_aggregated")
        if "screening_sessions" in sql_lower:
            tables.append("momentlab.screening_sessions")
        if "system." in sql_lower or "query_log" in sql_lower:
            tables.append("system.query_log")

        captured_query_objects.append({
            "query_id": f"q_mcp_{uuid.uuid4().hex[:8]}",
            "query": sql,
            "read_rows": None,
            "query_duration_ms": None,
            "tables": tables,
            "query_start_time": datetime.fromtimestamp(start_time, tz=timezone.utc).isoformat(),
            "origin": "mcp_capture"
        })

    # 2. Correlate with ClickHouse system.query_log (expanded window to handle clock drift)
    run_started_at = start_time
    run_finished_at = time.time()
    st_sec = int(run_started_at) - 120  # 2 minute buffer before run start to absorb wall clock drift
    en_sec = int(run_finished_at) + 30

    found_log_rows = []
    max_poll_seconds = MAX_POLL_SECONDS
    poll_start = time.time()

    try:
        from backend.services.clickhouse import get_client
        ch_client = get_client()

        q_log_query = """
            SELECT query_id, query, read_rows, query_duration_ms, tables, query_start_time, type
            FROM system.query_log
            WHERE type IN ('QueryFinish', 'QueryStart')
              AND user = 'momentlab_mcp_reader'
              AND (
                hasAny(tables, ['momentlab.audience_events', 'momentlab.reaction_events', 'momentlab.retention_by_second_aggregated', 'momentlab.reaction_anomalies_aggregated'])
                OR query LIKE '%audience_events%'
                OR query LIKE '%reaction_events%'
                OR query LIKE '%retention_by_second%'
                OR query LIKE '%reaction_anomalies%'
              )
              AND query NOT LIKE '%system.query_log%'
              AND toUnixTimestamp(query_start_time) >= {st_sec:UInt32}
              AND toUnixTimestamp(query_start_time) <= {en_sec:UInt32}
            ORDER BY query_start_time ASC
        """

        poll_iter = 0
        st_iso = datetime.fromtimestamp(st_sec, tz=timezone.utc).isoformat()

        while time.time() - poll_start < max_poll_seconds:
            poll_iter += 1
            curr_en_sec = max(en_sec, int(time.time()) + 30)

            # Flush query logs on every poll iteration
            try:
                ch_client.query("SYSTEM FLUSH LOGS")
            except Exception as f_err:
                logger.debug(f"SYSTEM FLUSH LOGS call error: {f_err}")

            q_log_query_cluster = q_log_query.replace("FROM system.query_log", "FROM clusterAllReplicas('default', system, query_log)")
            try:
                q_res = ch_client.query(q_log_query_cluster, parameters={'st_sec': st_sec, 'en_sec': curr_en_sec})
            except Exception:
                q_res = ch_client.query(q_log_query, parameters={'st_sec': st_sec, 'en_sec': curr_en_sec})

            found_by_id = {}
            if q_res and q_res.result_rows:
                for r in q_res.result_rows:
                    if r and r[0]:
                        qid = str(r[0])
                        row_type = str(r[6]) if len(r) > 6 else "QueryFinish"
                        row_dict = {
                            "query_id": qid,
                            "query": str(r[1]),
                            "read_rows": int(r[2]),
                            "query_duration_ms": int(r[3]),
                            "tables": list(r[4]) if isinstance(r[4], (list, tuple)) else [str(r[4])],
                            "query_start_time": str(r[5]) if len(r) > 5 else "",
                            "type": row_type,
                            "origin": "query_log"
                        }
                        # Prefer QueryFinish over QueryStart if available
                        if qid not in found_by_id or row_type == "QueryFinish":
                            found_by_id[qid] = row_dict
            
            found_log_rows = list(found_by_id.values())

            if found_log_rows:
                has_data_query = any(_is_data_query(q) for q in found_log_rows)
                if has_data_query:
                    logger.info(f"Found {len(found_log_rows)} agent query log(s) including data query after {time.time() - poll_start:.2f}s")
                    break

            time.sleep(1.0)
            try:
                ch_client.query("SYSTEM FLUSH LOGS")
            except Exception:
                pass

    except Exception as q_err:
        logger.warning(f"Could not fetch query IDs from system.query_log: {q_err}")

    # 3. Merge captured MCP tool queries with system.query_log rows
    # Prefer system.query_log entries (which contain real query_id, read_rows, query_duration_ms)
    run_queries = list(found_log_rows)
    for cap_q in captured_query_objects:
        cap_sql = cap_q["query"].strip()
        # Check if already present in found_log_rows by query text similarity
        already_in_log = any(
            cap_sql.lower() in log_q["query"].lower() or log_q["query"].lower() in cap_sql.lower()
            for log_q in found_log_rows
        )
        if not already_in_log:
            run_queries.append(cap_q)

    parsed_res["agentQueryRunIds"] = [q["query_id"] for q in run_queries]

    # Calculate grounding state based on successful ClickHouse data queries
    successful_data_query_count, is_grounded = compute_grounding(run_queries)

    parsed_res["grounded"] = is_grounded
    parsed_res["successfulDataQueryCount"] = successful_data_query_count
    if not is_grounded:
        parsed_res["status"] = "UNGROUNDED"

    # PERMANENT INFO-LEVEL OBSERVABILITY LOG (Requirement 3)
    st_iso = datetime.fromtimestamp(st_sec, tz=timezone.utc).isoformat()
    en_iso = datetime.fromtimestamp(en_sec, tz=timezone.utc).isoformat()
    logger.info(
        "Grounding correlation run_id=%s: window=[%s .. %s], query_log_rows=%d, captured_mcp_queries=%d, data_queries=%d, decision=%s",
        run_id, st_iso, en_iso, len(found_log_rows), len(captured_mcp_queries), successful_data_query_count, "GROUNDED" if is_grounded else "UNGROUNDED"
    )

    def _match_record_to_query(rec: dict, queries: list) -> dict:
        if not queries:
            logger.debug("_match_record_to_query: queries is empty -> None")
            return None
        
        metric = (rec.get("metric") or "").lower()
        segment = (rec.get("segment") or "").lower()
        window = (rec.get("window") or "").lower()
        
        is_reaction = any(k in metric for k in ["reaction", "confusion", "boredom", "exit", "spike"])
        is_audience = any(k in metric for k in ["retention", "cliff", "response", "drop"])
        family = "reaction" if is_reaction else ("audience" if is_audience else "other")

        logger.debug(f"Matching record rec_id={rec.get('id')} metric='{metric}' family={family}")
        
        candidates = []
        for q in queries:
            # Provenance requirement: consider ONLY entries whose origin is 'query_log'
            if q.get("origin") != "query_log":
                logger.debug(f"  cand q_id={q.get('query_id')} REJECTED: origin={q.get('origin')} is not query_log")
                continue

            q_tables = [t.lower() for t in q.get("tables", [])]
            q_text = (q.get("query") or "").lower()
            
            # Reject system introspection queries
            if any(t.startswith("system.") for t in q_tables):
                logger.debug(f"  cand q_id={q.get('query_id')} REJECTED: system tables {q_tables}")
                continue

            if is_reaction:
                if not any(("reaction_events" in t or "reaction_anomalies" in t) for t in q_tables) and not ("reaction_events" in q_text or "reaction_anomalies" in q_text):
                    logger.debug(f"  cand q_id={q.get('query_id')} REJECTED: reaction metric but tables {q_tables} does not contain reaction tables")
                    continue
            elif is_audience:
                if not any(("audience_events" in t or "retention_by_second" in t) for t in q_tables) and not ("audience_events" in q_text or "retention_by_second" in q_text):
                    logger.debug(f"  cand q_id={q.get('query_id')} REJECTED: audience metric but tables {q_tables} does not contain audience tables")
                    continue
            
            score = 1
            if ("18" in segment or "24" in segment) and ("18_24" in q_text or "18-24" in q_text):
                score += 2
            elif ("25" in segment or "34" in segment) and ("25_34" in q_text or "25-34" in q_text):
                score += 2
            elif ("35" in segment or "44" in segment) and ("35_44" in q_text or "35-44" in q_text):
                score += 2

            nums = re.findall(r'\d+', window)
            for n in nums:
                if len(n) == 2:
                    sec_val = int(n)
                    ms_val = sec_val * 1000
                    if str(ms_val) in q_text or str(sec_val) in q_text:
                        score += 1

            logger.debug(f"  cand q_id={q.get('query_id')} ACCEPTED score={score} tables={q_tables}")
            candidates.append((score, q))
            
        if not candidates:
            logger.debug(f"rec_id={rec.get('id')}: no valid candidates after filtering -> None")
            return None
            
        candidates.sort(key=lambda x: x[0], reverse=True)
        winner = candidates[0][1]
        logger.debug(f"rec_id={rec.get('id')} WINNER q_id={winner['query_id']} score={candidates[0][0]}")
        return winner


    evidence_records = parsed_res.get("evidenceRecords", [])
    if isinstance(evidence_records, list):
        for rec in evidence_records:
            if isinstance(rec, dict):
                matched = _match_record_to_query(rec, run_queries)
                if matched:
                    rec["sourceQueryRunId"] = matched["query_id"]
                    rec["readRows"] = matched["read_rows"]
                    rec["queryDurationMs"] = matched["query_duration_ms"]
                else:
                    rec["sourceQueryRunId"] = None
                    rec["readRows"] = None
                    rec["queryDurationMs"] = None
    parsed_res["evidenceRecords"] = evidence_records

    # 4. Second-stage Gemini 2.5 Pro multimodal video grounding (corroborating observation)
    grounding_info = _perform_video_grounding(project_id, parsed_res)
    if grounding_info:
        parsed_res["visualGrounding"] = grounding_info

    return parsed_res


# All three registered demo scenes are 65 seconds
SCENE_DURATION_SEC = 65


def _parse_timecode_token(token: str) -> Optional[int]:
    """Converts a timecode string ('HH:MM:SS', 'MM:SS', or bare seconds) to total seconds."""
    if not token:
        return None
    t = token.strip().rstrip('sS').strip()
    if ':' in t:
        parts = t.split(':')
        if len(parts) == 2 and all(p.isdigit() for p in parts):
            return int(parts[0]) * 60 + int(parts[1])
        elif len(parts) == 3 and all(p.isdigit() for p in parts):
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
    elif t.isdigit():
        return int(t)
    return None


def _parse_window_string(w_str: str) -> tuple[Optional[int], Optional[int]]:
    """
    Parses timecodes from a window/timestamp string.
    Supports HH:MM:SS, MM:SS, bare seconds, and en-dash (–) or hyphen (-) separators.
    Returns (start_sec, end_sec).
    """
    if not w_str:
        return None, None

    # Range pattern: e.g. "00:33-00:41", "00:33–00:41", "33-41", "00:01:30-00:02:10"
    range_match = re.search(
        r'(\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2}|\d+)\s*[-–—]\s*(\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2}|\d+)',
        w_str
    )
    if range_match:
        s = _parse_timecode_token(range_match.group(1))
        e = _parse_timecode_token(range_match.group(2))
        if s is not None and e is not None:
            return s, e

    # Single timecode pattern: e.g. "00:33", "01:05", "33"
    single_match = re.search(r'(\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2}|\d+)', w_str)
    if single_match:
        s = _parse_timecode_token(single_match.group(1))
        if s is not None:
            return s, s + 8

    return None, None


def _derive_grounding_window(parsed_res: Any) -> tuple[str, str]:
    """
    Derives the video clip grounding window (start_offset, end_offset) from parsed hypothesis results.
    Pads by 3 seconds on each side, clamps to [0, SCENE_DURATION_SEC], and falls back to ('30s', '44s')
    if no valid range is found or if the range is inverted/zero-length.
    """
    start_sec = None
    end_sec = None

    candidate_strings = []
    if isinstance(parsed_res, str):
        candidate_strings.append(parsed_res)
    elif isinstance(parsed_res, dict):
        evidence_records = parsed_res.get("evidenceRecords")
        if isinstance(evidence_records, list):
            for rec in evidence_records:
                if isinstance(rec, dict):
                    for key in ("window", "timeRange", "timestamp"):
                        val = rec.get(key)
                        if val:
                            candidate_strings.append(str(val))

        for key in ("window", "timeRange", "timestamp", "anomalyWindow"):
            val = parsed_res.get(key)
            if val:
                candidate_strings.append(str(val))

    for c_str in candidate_strings:
        s, e = _parse_window_string(c_str)
        if s is not None and e is not None and e > s:
            start_sec, end_sec = s, e
            break

    if start_sec is None or end_sec is None or end_sec <= start_sec:
        start_sec, end_sec = 33, 41

    pad_start = max(0, start_sec - 3)
    pad_end = min(SCENE_DURATION_SEC, end_sec + 3)
    if pad_end <= pad_start:
        pad_end = pad_start + 10

    return f"{pad_start}s", f"{pad_end}s"


def _perform_video_grounding(project_id: str, parsed_res: dict) -> Optional[dict]:
    """
    Second-stage Gemini 2.5 Pro multimodal video grounding call.
    Runs after ClickHouse agent analysis to provide corroborating visual observation.
    Fails open safely (returning None) if permissions, missing GCS object, model error,
    safety block, or output token truncation occurs.
    """
    try:
        from backend.routers.projects import PROJECT_MEDIA
        media_info = PROJECT_MEDIA.get(project_id)
        if not media_info or not media_info.get("video_url"):
            logger.info("Video grounding skipped: project_id '%s' has no registered video media.", project_id)
            return None

        video_url = media_info["video_url"].lstrip("/")
        bucket_name = os.getenv("GCS_MEDIA_BUCKET", "momentlab-504305-media")
        gcs_uri = f"gs://{bucket_name}/{video_url}"

        start_offset_str, end_offset_str = _derive_grounding_window(parsed_res)

        from google.genai import Client
        client = Client(
            vertexai=True,
            project=os.environ.get("GOOGLE_CLOUD_PROJECT", "momentlab-504305"),
            location=os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
        )

        part = types.Part.from_uri(file_uri=gcs_uri, mime_type="video/mp4")
        part.video_metadata = types.VideoMetadata(start_offset=start_offset_str, end_offset=end_offset_str)

        prompt_text = (
            f"Provide a short, concrete visual description of what happens in this video clip between {start_offset_str} and {end_offset_str}: "
            f"what is on screen, what changes, and what a viewer might find confusing or slow."
        )

        config = types.GenerateContentConfig(
            safety_settings=[
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                ),
            ],
            max_output_tokens=2048
        )

        response = client.models.generate_content(
            model="gemini-2.5-pro",
            contents=[part, prompt_text],
            config=config
        )

        if not response or not getattr(response, "candidates", None):
            logger.warning("Video grounding returned no candidates.")
            return None

        candidate = response.candidates[0]
        finish_reason = getattr(candidate, "finish_reason", None)
        finish_reason_str = str(finish_reason or "").upper()

        if "MAX_TOKENS" in finish_reason_str:
            logger.warning("Video grounding output truncated with MAX_TOKENS; discarding incomplete response.")
            return None

        if finish_reason_str in ("SAFETY", "BLOCKLIST", "PROHIBITED_CONTENT", "IMAGE_SAFETY", "IMAGE_PROHIBITED_CONTENT"):
            logger.warning("Video grounding response was blocked by safety filter (%s).", finish_reason_str)
            return None

        obs_text = getattr(response, "text", "") or ""
        if not obs_text.strip():
            return None

        logger.info("Successfully generated corroborating video grounding for %s window [%s..%s]", gcs_uri, start_offset_str, end_offset_str)
        return {
            "observation": obs_text.strip(),
            "fileUri": gcs_uri,
            "startOffset": start_offset_str,
            "endOffset": end_offset_str
        }
    except Exception as err:
        logger.warning("Video grounding stage encountered an error (failing open): %s", err)
        return None


