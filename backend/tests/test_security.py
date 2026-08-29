from fastapi.testclient import TestClient
from backend.main import app
import os
import pytest

client = TestClient(app)

# Ensure the test uses a known valid token
os.environ["REVIEWER_TOKENS"] = "test_reviewer_token_sec,valid_reviewer_token_123"

def test_unauthenticated_approve_must_401():
    response = client.post("/api/v1/projects/proj_northlight_01/experiments/exp_23a:approve")
    assert response.status_code == 401
    
def test_forged_token_approve_must_401():
    response = client.post(
        "/api/v1/projects/proj_northlight_01/experiments/exp_23a:approve",
        headers={"Authorization": "Bearer totally_made_up_person"}
    )
    assert response.status_code == 401

def test_valid_token_approve_succeeds():
    response = client.post(
        "/api/v1/projects/proj_northlight_01/experiments/exp_23a:approve",
        headers={"Authorization": "Bearer valid_reviewer_token_123"}
    )
    assert response.status_code == 200

def test_unauthenticated_reset_must_401():
    response = client.post("/api/v1/telemetry/reset")
    assert response.status_code == 401

def test_sql_injection_payload_must_not_return_data():
    response = client.get("/api/v1/telemetry/timeline?project_id=NOPE' OR '1'='1&experiment_id=nope")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0

def test_missing_reviewer_tokens_fails_closed(monkeypatch):
    monkeypatch.delenv("REVIEWER_TOKENS", raising=False)
    response = client.post(
        "/api/v1/projects/proj_northlight_01/experiments/exp_23a:approve",
        headers={"Authorization": "Bearer valid_reviewer_token_123"}
    )
    assert response.status_code == 503
    assert "REVIEWER_TOKENS not configured" in response.json()["detail"]

def test_empty_reviewer_tokens_fails_closed(monkeypatch):
    monkeypatch.setenv("REVIEWER_TOKENS", "  ,  ")
    response = client.post(
        "/api/v1/projects/proj_northlight_01/experiments/exp_23a:approve",
        headers={"Authorization": "Bearer valid_reviewer_token_123"}
    )
    assert response.status_code == 503
