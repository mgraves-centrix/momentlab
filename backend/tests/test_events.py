import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.simulator.fixtures import generate_northlight_simulated_events

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"

def test_screening_consent_registration():
    # Test valid consent
    consent_payload = {
        "screening_token": "token_demo_999",
        "project_id": "proj_northlight_01",
        "experiment_id": "exp_23a",
        "scene_id": "sc_12",
        "respondent_cohort": "18_24",
        "consent_given": True
    }
    res = client.post("/api/v1/screenings/consent", json=consent_payload)
    assert res.status_code == 200
    assert res.json()["consent_given"] is True

    # Test consent denial
    denied_payload = {**consent_payload, "consent_given": False}
    res_denied = client.post("/api/v1/screenings/consent", json=denied_payload)
    assert res_denied.status_code == 400

def test_playback_event_ingestion_and_idempotency():
    event_payload = {
        "session_id": "sess_test_100",
        "project_id": "proj_northlight_01",
        "experiment_id": "exp_23a",
        "scene_id": "sc_12",
        "media_time_ms": 37000,
        "retention_score": 50.0,
        "playback_state": "PLAYING",
        "idempotency_key": "idemp_test_37000"
    }

    # First insertion - SUCCESS
    res1 = client.post("/api/v1/events/playback", json=event_payload)
    assert res1.status_code == 200
    assert res1.json()["status"] == "SUCCESS"
    assert res1.json()["inserted_count"] == 1

    # Duplicate insertion - DUPLICATE
    res2 = client.post("/api/v1/events/playback", json=event_payload)
    assert res2.status_code == 200
    assert res2.json()["status"] == "DUPLICATE"
    assert res2.json()["inserted_count"] == 0

def test_northlight_simulated_timeline_alignment():
    events = generate_northlight_simulated_events(count=10)
    assert len(events) >= 500  # 10 respondents across 61 timepoints with realistic dropouts
    
    # Check 00:37 cliff alignment
    cliff_events = [e for e in events if e["media_time_ms"] == 37000]
    assert len(cliff_events) >= 7
    for e in cliff_events:
        # Retention drops around ~50%
        assert 40.0 <= e["retention_score"] <= 60.0
