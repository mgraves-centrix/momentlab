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
    assert data["database_connected"] is True
    assert data["database_host"] is not None
    assert data["server_version"] is not None

def test_health_check_failure(monkeypatch):
    monkeypatch.setenv("CLICKHOUSE_HOST", "nonexistent.invalid")
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UNHEALTHY"
    assert data["database_connected"] is False
    assert data["database_host"] == "nonexistent.invalid"
    assert data["database_version"] is None
    assert "password" not in str(data).lower()

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
    sess_id = str(uuid.uuid4())
    event_payload = {
        "session_id": sess_id,
        "project_id": "proj_northlight_01",
        "experiment_id": "exp_23a",
        "scene_id": "sc_12",
        "media_time_ms": 37000,
        "retention_score": 50.0,
        "playback_state": "PLAYING",
        "idempotency_key": f"idemp_test_{sess_id[:8]}_37000"
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

import uuid

def test_telemetry_reaction_events_ingestion():
    # Single event with omitted idempotency_key
    sid1 = str(uuid.uuid4())
    single_ev = {
        "session_id": sid1,
        "project_id": "proj_northlight_01",
        "experiment_id": "exp_23a",
        "scene_id": "sc_12",
        "media_time_ms": 1000,
        "reaction_type": "CONFUSED",
        "value": 0.45
    }
    res = client.post("/api/v1/telemetry/events", json=single_ev)
    assert res.status_code == 201
    assert res.json()["status"] == "SUCCESS"
    assert res.json()["inserted_count"] == 1

    # List of events
    sid2 = str(uuid.uuid4())
    batch_ev = [
        {
            "session_id": sid2,
            "project_id": "proj_northlight_01",
            "experiment_id": "exp_23a",
            "scene_id": "sc_12",
            "media_time_ms": 2000,
            "reaction_type": "ENGAGING",
            "value": 0.95
        }
    ]
    res_batch = client.post("/api/v1/telemetry/events", json=batch_ev)
    assert res_batch.status_code == 201
    assert res_batch.json()["status"] == "SUCCESS"
    assert res_batch.json()["inserted_count"] == 1

def test_telemetry_reaction_events_invalid_payload_honesty():
    # Invalid session_id must produce non-2xx status and not report SUCCESS
    bad_payload = {
        "session_id": "not-a-uuid",
        "project_id": "proj_northlight_01",
        "experiment_id": "exp_23a",
        "scene_id": "sc_12",
        "media_time_ms": 37000,
        "reaction_type": "CONFUSED"
    }
    res = client.post("/api/v1/telemetry/events", json=bad_payload)
    assert res.status_code != 200 and res.status_code != 201
    assert res.status_code in (400, 422, 500)
    assert "SUCCESS" not in str(res.json().get("status", ""))

