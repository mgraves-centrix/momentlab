from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_list_projects_endpoint():
    response = client.get("/api/v1/projects")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 3
    assert data[0]["project_id"] == "proj_northlight_01"

def test_create_and_delete_project_endpoint():
    payload = {"title": "Temporary Test Project", "description": "Unit test project", "owner_id": "user_dev_01"}
    response = client.post(
        "/api/v1/projects", 
        json=payload,
        headers={"Authorization": "Bearer valid_reviewer_token_123"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Temporary Test Project"
    assert "project_id" in data
    proj_id = data["project_id"]

    # Clean up immediately so test runs do not leak state
    del_response = client.delete(
        f"/api/v1/projects/{proj_id}",
        headers={"Authorization": "Bearer valid_reviewer_token_123"}
    )
    assert del_response.status_code == 200
    assert del_response.json()["status"] == "DELETED"

def test_get_scene_timeline_endpoint():
    response = client.get("/api/v1/scenes/sc_12/timeline")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "allCohort" in data[0]

def test_approve_hypothesis_endpoint():
    response = client.post(
        "/api/v1/projects/proj_northlight_01/experiments/exp_23a:approve",
        headers={"Authorization": "Bearer valid_reviewer_token_123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "APPROVED"
    assert "audit_id" in data

def test_generate_hypothesis_failure_returns_502():
    from unittest.mock import patch
    with patch("backend.routers.hypotheses.generate_hypothesis", side_effect=RuntimeError("ADK connection timeout")):
        response = client.post("/api/v1/projects/proj_northlight_01/experiments/exp_23a/generate-hypothesis")
        assert response.status_code == 502
        assert "Hypothesis generation failed: ADK connection timeout" in response.json()["detail"]

def test_generate_hypothesis_success_returns_hypothesis():
    from unittest.mock import patch
    mock_payload = {
        "id": "hyp_test_01",
        "proposedChange": "Move reveal earlier",
        "confidenceScore": 92,
        "rationale": "Evidence-backed shift",
        "forecastEngagement": "+18%",
        "forecastCompletion": "+9%",
        "forecastConfusion": "-4%",
        "evidenceIds": ["ev_01"],
        "evidenceRecords": [],
        "trace": {"runId": "trace_01", "totalDurationMs": 120, "steps": []},
        "status": "PROPOSED",
        "isSimulated": True
    }
    with patch("backend.routers.hypotheses.generate_hypothesis", return_value=mock_payload):
        response = client.post("/api/v1/projects/proj_northlight_01/experiments/exp_23a/generate-hypothesis")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["hypothesis"]["confidenceScore"] == 92
        assert data["hypothesis"]["proposedChange"] == "Move reveal earlier"

