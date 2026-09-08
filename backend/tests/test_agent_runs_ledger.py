import pytest
from unittest.mock import MagicMock
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from backend.agents.mcp_client import record_agent_run
from backend.main import app

def test_record_agent_run_success():
    mock_client = MagicMock()
    now = datetime.now(timezone.utc)

    res = record_agent_run(
        run_id="run_test123",
        started_at=now,
        project_id="proj_northlight_01",
        experiment_id="exp_23a",
        model="gemini-2.5-pro",
        decision="GROUNDED",
        grounded=1,
        duration_ms=1200,
        mcp_query_count=3,
        data_query_count=2,
        primary_query="SELECT * FROM momentlab.audience_events",
        primary_rows=150,
        primary_ms=45,
        ch_client=mock_client
    )

    assert res is True
    mock_client.insert.assert_called_once()
    args, kwargs = mock_client.insert.call_args
    assert args[0] == "momentlab.agent_runs"
    assert len(args[1]) == 1
    row = args[1][0]
    assert row[0] == "run_test123"
    assert row[1] == now
    assert row[2] == "proj_northlight_01"
    assert row[3] == "exp_23a"
    assert row[4] == "gemini-2.5-pro"
    assert row[5] == "GROUNDED"
    assert row[6] == 1
    assert row[7] == 1200
    assert row[8] == 3
    assert row[9] == 2
    assert row[10] == "SELECT * FROM momentlab.audience_events"
    assert row[11] == 150
    assert row[12] == 45
    assert kwargs.get("column_names") == [
        "run_id", "started_at", "project_id", "experiment_id", "model",
        "decision", "grounded", "duration_ms", "mcp_query_count",
        "data_query_count", "primary_query", "primary_rows", "primary_ms"
    ]

def test_record_agent_run_swallows_exception():
    mock_client = MagicMock()
    mock_client.insert.side_effect = Exception("ClickHouse connection dropped")
    now = datetime.now(timezone.utc)

    res = record_agent_run(
        run_id="run_fail123",
        started_at=now,
        project_id="proj_northlight_01",
        experiment_id="exp_23a",
        model="gemini-2.5-pro",
        decision="UNGROUNDED",
        grounded=0,
        duration_ms=800,
        mcp_query_count=1,
        data_query_count=0,
        primary_query="",
        primary_rows=0,
        primary_ms=0,
        ch_client=mock_client
    )

    assert res is False

def test_get_agent_runs_endpoint(monkeypatch):
    mock_client = MagicMock()
    mock_result = MagicMock()
    now_dt = datetime(2026, 9, 8, 12, 0, 0, tzinfo=timezone.utc)
    mock_result.result_rows = [
        [
            "run_01",
            now_dt,
            "proj_northlight_01",
            "exp_23a",
            "gemini-2.5-pro",
            "GROUNDED",
            1,
            1500,
            2,
            1,
            "SELECT * FROM momentlab.audience_events",
            100,
            50
        ]
    ]
    mock_client.query.return_value = mock_result
    monkeypatch.setattr("backend.services.clickhouse.get_client", lambda: mock_client)

    client = TestClient(app)
    response = client.get("/api/v1/agent/runs")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    run = data[0]
    assert run["run_id"] == "run_01"
    assert run["started_at"] == "2026-09-08T12:00:00+00:00"
    assert run["project_id"] == "proj_northlight_01"
    assert run["experiment_id"] == "exp_23a"
    assert run["model"] == "gemini-2.5-pro"
    assert run["decision"] == "GROUNDED"
    assert run["grounded"] == 1
    assert run["duration_ms"] == 1500
    assert run["mcp_query_count"] == 2
    assert run["data_query_count"] == 1
    assert run["primary_query"] == "SELECT * FROM momentlab.audience_events"
    assert run["primary_rows"] == 100
    assert run["primary_ms"] == 50
