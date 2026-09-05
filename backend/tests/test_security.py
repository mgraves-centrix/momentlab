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

def test_unauthenticated_request_revision_must_401():
    response = client.post("/api/v1/projects/proj_northlight_01/experiments/exp_23a/hypothesis/request-revision")
    assert response.status_code == 401

def test_unauthenticated_discard_must_401():
    response = client.post("/api/v1/projects/proj_northlight_01/experiments/exp_23a/hypothesis/discard")
    assert response.status_code == 401

def test_unauthenticated_generate_hypothesis_must_401():
    response = client.post("/api/v1/projects/proj_northlight_01/experiments/exp_23a/generate-hypothesis")
    assert response.status_code == 401

def test_unauthenticated_veo_generate_must_401():
    response = client.post("/api/v1/media/veo-generate")
    assert response.status_code == 401

def test_unauthenticated_youtube_ingest_must_401():
    response = client.post("/api/v1/media/youtube-ingest")
    assert response.status_code == 401

def test_unauthenticated_project_media_upload_must_401():
    response = client.post("/api/v1/projects/proj_northlight_01/media?filename=test.mp4&content_type=video/mp4")
    assert response.status_code == 401

def test_participant_consent_must_not_be_401():
    response = client.post(
        "/api/v1/screenings/consent",
        json={"session_id": "55555555-5555-4555-8555-555555555555", "screening_token": "demo_token_123", "respondent_cohort": "25_34", "consent_given": True}
    )
    assert response.status_code != 401

def test_participant_playback_must_not_be_401():
    response = client.post(
        "/api/v1/events/playback",
        json={"session_id": "55555555-5555-4555-8555-555555555555", "project_id": "proj_northlight_01", "scene_id": "sc_12", "media_time_ms": 1000, "playback_state": "PLAYING"}
    )
    assert response.status_code != 401

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

def test_config_endpoint_leaks_no_credential():
    response = client.get("/api/v1/config")
    secret_tokens = [t.strip() for t in os.environ.get("REVIEWER_TOKENS", "").split(",") if t.strip()]
    body = response.text if response.status_code != 404 else ""
    for secret in secret_tokens:
        assert secret not in body
    assert "reviewer_token" not in response.text

def test_security_headers_present():
    response = client.get("/health")
    assert response.headers.get("Strict-Transport-Security") == "max-age=31536000; includeSubDomains"
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "Content-Security-Policy" in response.headers

def test_rate_limiting_burst_exceeded():
    statuses = []
    for i in range(70):
        res = client.post(
            "/api/v1/screenings/consent",
            json={"session_id": "00000000-0000-4000-8000-000000000001", "screening_token": "demo_token_123", "respondent_cohort": "25_34", "consent_given": True}
        )
        statuses.append(res.status_code)
    assert 429 in statuses

