import pytest
from backend.mcp.clickhouse_mcp_client import ClickHouseMcpClient

def test_mcp_client_tool_execution():
    client = ClickHouseMcpClient()
    res = client.execute_tool_query(
        tool_name="mcp_clickhouse_query",
        query_purpose="Investigate 00:37 response cliff retention drop",
        query_params={"project_id": "proj_northlight_01", "scene_id": "sc_12"}
    )

    assert res["status"] == "SUCCESS"
    assert len(res["rows"]) == 3
    assert res["rows"][1]["media_time_ms"] == 37000
    assert res["rows"][1]["retention"] == 50.0

def test_mcp_telemetry_trail_sanitization():
    client = ClickHouseMcpClient()
    client.execute_tool_query(
        tool_name="mcp_clickhouse_query",
        query_purpose="Aggregate second-by-second audience retention series",
        query_params={"project_id": "proj_northlight_01", "scene_id": "sc_12"}
    )
    
    trail = client.get_telemetry_history()
    assert len(trail) >= 1
    latest = trail[-1]
    assert "toolName" in latest
    assert latest["toolName"] == "mcp_clickhouse_query"
    assert "durationMs" in latest
    assert "rowCount" in latest
    assert "queryPurpose" in latest
    # Ensure sensitive credentials or raw connection strings are NOT in telemetry
    assert "password" not in latest
    assert "secret" not in latest

def test_mcp_unapproved_tool_rejection():
    client = ClickHouseMcpClient()
    with pytest.raises(ValueError, match="not allowlisted"):
        client.execute_tool_query(
            tool_name="unapproved_system_exec",
            query_purpose="Malicious query attempt",
            query_params={}
        )
