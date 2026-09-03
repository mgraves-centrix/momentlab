from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from backend.main import app

client = TestClient(app)

def test_summary_returns_null_when_detector_fields_absent(monkeypatch):
    """When the hypothesis doc lacks detector fields and ClickHouse returns no anomaly, telemetry summary returns None for those fields (no hardcoded fallbacks)."""
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {"confidenceScore": 92}

    mock_db = MagicMock()
    mock_db.collection.return_value.document.return_value.collection.return_value.document.return_value.collection.return_value.document.return_value.get.return_value = mock_doc

    mock_ch_client = MagicMock()
    # Return respondents count >= 100
    mock_res_resp = MagicMock()
    mock_res_resp.result_rows = [[500]]
    # Return timeline rows with no anomaly (flat line)
    mock_res_time = MagicMock()
    mock_res_time.result_rows = []
    
    def mock_query(sql, parameters=None):
        if "count(DISTINCT session_id)" in sql:
            return mock_res_resp
        return mock_res_time

    mock_ch_client.query.side_effect = mock_query

    monkeypatch.setattr("backend.services.db.get_db", lambda: mock_db)
    monkeypatch.setattr("backend.services.clickhouse.get_client", lambda: mock_ch_client)

    response = client.get("/api/v1/telemetry/summary?project_id=proj_northlight_01&experiment_id=exp_23a")
    assert response.status_code == 200
    data = response.json()

    assert data["confidence"] == 92
    assert data["retention_drop"] is None
    assert data["detected_moment"] is None
    assert data["detected_moment_ms"] is None
    assert data["anomaly_window"] is None

    # Assert fallback literals do NOT appear in the JSON text
    json_text = response.text
    assert "-34.2%" not in json_text
    assert "00:37" not in json_text
    assert "37000" not in json_text
    assert "00:33" not in json_text


def test_summary_reads_persisted_detector_fields(monkeypatch):
    """Telemetry summary reads and echoes exact detector fields persisted on the hypothesis document."""
    sentinel_doc = {
        "confidenceScore": 92,
        "retentionDrop": "-12.3%",
        "detectedMoment": "00:19",
        "detectedMomentMs": 19000,
        "anomalyWindow": "00:15-00:23"
    }
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = sentinel_doc

    mock_db = MagicMock()
    mock_db.collection.return_value.document.return_value.collection.return_value.document.return_value.collection.return_value.document.return_value.get.return_value = mock_doc

    mock_ch_client = MagicMock()
    mock_res_resp = MagicMock()
    mock_res_resp.result_rows = [[500]]
    mock_ch_client.query.return_value = mock_res_resp

    monkeypatch.setattr("backend.services.db.get_db", lambda: mock_db)
    monkeypatch.setattr("backend.services.clickhouse.get_client", lambda: mock_ch_client)

    response = client.get("/api/v1/telemetry/summary?project_id=proj_northlight_01&experiment_id=exp_23a")
    assert response.status_code == 200
    data = response.json()

    assert data["confidence"] == 92
    assert data["retention_drop"] == "-12.3%"
    assert data["detected_moment"] == "00:19"
    assert data["detected_moment_ms"] == 19000
    assert data["anomaly_window"] == "00:15-00:23"
