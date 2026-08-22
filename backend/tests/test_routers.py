from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_list_projects_endpoint():
    response = client.get("/api/v1/projects")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(p.get("project_id") == "proj_northlight_01" for p in data)

def test_create_project_endpoint():
    payload = {"title": "Test Project", "description": "Unit test project", "owner_id": "user_dev_01"}
    response = client.post("/api/v1/projects", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Project"
    assert "project_id" in data

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
        headers={"Authorization": "Bearer admin_token_demo"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "APPROVED"
    assert "audit_id" in data
