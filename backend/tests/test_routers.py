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
    response = client.post("/api/v1/projects", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Temporary Test Project"
    assert "project_id" in data
    proj_id = data["project_id"]

    # Clean up immediately so test runs do not leak state
    del_response = client.delete(f"/api/v1/projects/{proj_id}")
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
        headers={"Authorization": "Bearer admin_token_demo"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "APPROVED"
    assert "audit_id" in data
