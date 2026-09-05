import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from backend.agents.mcp_client import compute_grounding

@pytest.fixture
def api_client():
    from backend.main import app
    from fastapi.testclient import TestClient
    return TestClient(app)


# ============================================================================
# 1. PURE FUNCTION TESTS (compute_grounding)
# ============================================================================

def test_compute_grounding_empty_queries():
    """[] -> (0, False)"""
    run_queries = []
    count, is_grounded = compute_grounding(run_queries)
    assert count == 0
    assert is_grounded is False


def test_compute_grounding_introspection_queries_only():
    """only system.* introspection rows -> (0, False) - case that bit us"""
    run_queries = [
        {
            "query_id": "q_sys_01",
            "query": "SELECT name, type FROM system.tables WHERE database = 'momentlab'",
            "read_rows": 10,
            "query_duration_ms": 5,
            "tables": ["system.tables"],
            "query_start_time": "2026-09-04 22:00:00"
        },
        {
            "query_id": "q_sys_02",
            "query": "SELECT query_id, query FROM system.query_log WHERE type = 'QueryFinish'",
            "read_rows": 50,
            "query_duration_ms": 12,
            "tables": ["system.query_log"],
            "query_start_time": "2026-09-04 22:00:01"
        }
    ]
    count, is_grounded = compute_grounding(run_queries)
    assert count == 0
    assert is_grounded is False


def test_compute_grounding_single_data_query():
    """one momentlab.audience_events row -> (1, True)"""
    run_queries = [
        {
            "query_id": "q_data_01",
            "query": "SELECT toInt32(media_time_ms / 1000) AS sec, avg(retention_score) FROM momentlab.audience_events GROUP BY sec",
            "read_rows": 525,
            "query_duration_ms": 45,
            "tables": ["momentlab.audience_events"],
            "query_start_time": "2026-09-04 22:00:02"
        }
    ]
    count, is_grounded = compute_grounding(run_queries)
    assert count == 1
    assert is_grounded is True


def test_compute_grounding_mixed_queries():
    """mixed introspection + one data row -> (1, True)"""
    run_queries = [
        {
            "query_id": "q_sys_01",
            "query": "SELECT name FROM system.tables",
            "read_rows": 5,
            "query_duration_ms": 2,
            "tables": ["system.tables"],
            "query_start_time": "2026-09-04 22:00:00"
        },
        {
            "query_id": "q_data_01",
            "query": "SELECT count() FROM momentlab.reaction_events WHERE project_id='proj_northlight_01'",
            "read_rows": 120,
            "query_duration_ms": 18,
            "tables": ["momentlab.reaction_events"],
            "query_start_time": "2026-09-04 22:00:03"
        }
    ]
    count, is_grounded = compute_grounding(run_queries)
    assert count == 1
    assert is_grounded is True


# ============================================================================
# 2. END-TO-END ENDPOINT TESTS (Patching BELOW generate_hypothesis)
# ============================================================================

def _make_mock_runner_and_client(query_log_rows):
    """Helper to mock agent execution runner and ClickHouse client below generate_hypothesis."""
    mock_event = MagicMock()
    mock_event.author = "agent"
    mock_event.id = "ev_01"
    mock_part = MagicMock()
    mock_part.text = '''{
        "id": "hyp_gen_01",
        "proposedChange": "Move reveal 6s earlier",
        "rationale": "Test hypothesis rationale derived from telemetry",
        "confidenceScore": 85,
        "forecastEngagement": "+18%",
        "forecastCompletion": "+9%",
        "forecastConfusion": "-4%",
        "evidenceIds": [],
        "evidenceRecords": [],
        "status": "PROPOSED",
        "isSimulated": true
    }'''
    mock_part.function_call = None
    mock_part.function_response = None
    mock_event.content = MagicMock(parts=[mock_part])
    mock_event.get_function_calls.return_value = []
    mock_event.get_function_responses.return_value = []

    async def mock_run_async(*args, **kwargs):
        yield mock_event

    mock_ch_client = MagicMock()
    mock_query_res = MagicMock()
    mock_query_res.result_rows = query_log_rows
    mock_ch_client.query.return_value = mock_query_res

    mock_mcp_toolset = MagicMock()
    mock_mcp_toolset.__aenter__ = AsyncMock(return_value=mock_mcp_toolset)
    mock_mcp_toolset.__aexit__ = AsyncMock(return_value=None)

    return mock_run_async, mock_ch_client, mock_mcp_toolset


@pytest.mark.anyio
async def test_ungrounded_run_endpoint_integration(api_client):
    """Verifies that when agent query log returns 0 data queries, the real generate_hypothesis computes grounded: False and status: UNGROUNDED."""
    mock_run_async, mock_ch_client, mock_mcp_toolset = _make_mock_runner_and_client([])
    
    t_state = {"t": 1000.0}
    def mock_time():
        t_state["t"] += 10.0
        return t_state["t"]

    with patch("backend.agents.mcp_client.McpToolset", return_value=mock_mcp_toolset), \
         patch("backend.agents.mcp_client.StdioServerParameters", MagicMock()), \
         patch("backend.agents.mcp_client.StdioConnectionParams", MagicMock()), \
         patch("google.adk.Runner.run_async", side_effect=mock_run_async), \
         patch("backend.services.clickhouse.get_client", return_value=mock_ch_client), \
         patch("time.sleep", return_value=None), \
         patch("time.time", side_effect=mock_time):
        response = api_client.post("/api/v1/projects/proj_northlight_01/experiments/exp_23a/generate-hypothesis")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        hypothesis = data["hypothesis"]
        
        # Real generate_hypothesis & compute_grounding executed and calculated these:
        assert hypothesis.get("grounded") is False
        assert hypothesis.get("successfulDataQueryCount") == 0
        assert hypothesis.get("status") == "UNGROUNDED"


@pytest.mark.anyio
async def test_grounded_run_endpoint_integration(api_client):
    """Verifies that when agent query log returns ClickHouse data query rows, real generate_hypothesis computes grounded: True."""
    query_log_rows = [
        (
            "q_run_12345",
            "SELECT avg(retention_score) FROM momentlab.audience_events WHERE project_id='proj_northlight_01'",
            525,
            35,
            ["momentlab.audience_events"],
            "2026-09-04 22:00:00"
        )
    ]
    mock_run_async, mock_ch_client, mock_mcp_toolset = _make_mock_runner_and_client(query_log_rows)
    
    with patch("backend.agents.mcp_client.McpToolset", return_value=mock_mcp_toolset), \
         patch("backend.agents.mcp_client.StdioServerParameters", MagicMock()), \
         patch("backend.agents.mcp_client.StdioConnectionParams", MagicMock()), \
         patch("google.adk.Runner.run_async", side_effect=mock_run_async), \
         patch("backend.services.clickhouse.get_client", return_value=mock_ch_client), \
         patch("time.sleep", return_value=None):
        response = api_client.post("/api/v1/projects/proj_northlight_01/experiments/exp_23a/generate-hypothesis")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        hypothesis = data["hypothesis"]
        
        # Real generate_hypothesis & compute_grounding executed and calculated these:
        assert hypothesis.get("grounded") is True
        assert hypothesis.get("successfulDataQueryCount") == 1
        assert "q_run_12345" in hypothesis.get("agentQueryRunIds")
