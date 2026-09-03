import uuid
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
    assert "git_sha" in data
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
    sid = str(uuid.uuid4())
    consent_payload = {
        "session_id": sid,
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
    assert res.json()["session_id"] == sid

    # Test consent denial
    denied_payload = {**consent_payload, "session_id": str(uuid.uuid4()), "consent_given": False}
    res_denied = client.post("/api/v1/screenings/consent", json=denied_payload)
    assert res_denied.status_code == 400

def test_consent_persists_session():
    sid = str(uuid.uuid4())
    res = client.post("/api/v1/screenings/consent", json={
        "session_id": sid,
        "screening_token": "tok_p11",
        "project_id": "proj_northlight_01",
        "experiment_id": "exp_23a",
        "scene_id": "sc_12",
        "respondent_cohort": "25_34",
        "consent_given": True
    })
    assert res.status_code == 200

    from backend.services.clickhouse import get_client, get_db_name
    ch = get_client()
    db = get_db_name()
    q_res = ch.query(f"SELECT count() FROM {db}.screening_sessions WHERE session_id=toUUID('{sid}')")
    assert q_res.result_rows[0][0] == 1

def test_unknown_screening_token_rejected():
    sid = str(uuid.uuid4())
    res = client.post("/api/v1/screenings/consent", json={
        "session_id": sid,
        "screening_token": "not_a_real_token",
        "project_id": "proj_northlight_01",
        "experiment_id": "exp_23a",
        "scene_id": "sc_12",
        "respondent_cohort": "25_34",
        "consent_given": True
    })
    assert res.status_code == 404

def test_unconsented_playback_rejected():
    bad_sid = str(uuid.uuid4())
    res = client.post("/api/v1/events/playback", json={
        "session_id": bad_sid,
        "project_id": "proj_northlight_01",
        "experiment_id": "exp_23a",
        "scene_id": "sc_12",
        "media_time_ms": 1000,
        "playback_state": "PLAYING",
        "idempotency_key": f"{bad_sid}:1"
    })
    assert res.status_code == 403

def test_consented_playback_accepted():
    sid = str(uuid.uuid4())
    client.post("/api/v1/screenings/consent", json={
        "session_id": sid,
        "screening_token": "demo_token_123",
        "project_id": "proj_northlight_01",
        "experiment_id": "exp_23a",
        "scene_id": "sc_12",
        "respondent_cohort": "18_24",
        "consent_given": True
    })

    res = client.post("/api/v1/events/playback", json={
        "session_id": sid,
        "project_id": "proj_northlight_01",
        "experiment_id": "exp_23a",
        "scene_id": "sc_12",
        "media_time_ms": 1000,
        "playback_state": "PLAYING",
        "idempotency_key": f"{sid}:1"
    })
    assert res.status_code == 200
    assert res.json()["status"] == "SUCCESS"
    assert res.json()["inserted_count"] == 1

def test_retention_not_client_supplied():
    from backend.schemas.events import PlaybackEvent
    fields = PlaybackEvent.model_fields
    assert fields["retention_score"].is_required() is False

def test_playback_event_ingestion_and_idempotency():
    sess_id = str(uuid.uuid4())
    client.post("/api/v1/screenings/consent", json={
        "session_id": sess_id,
        "screening_token": "demo_token_123",
        "respondent_cohort": "18_24",
        "consent_given": True
    })

    event_payload = {
        "session_id": sess_id,
        "project_id": "proj_northlight_01",
        "experiment_id": "exp_23a",
        "scene_id": "sc_12",
        "media_time_ms": 37000,
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
    assert len(events) >= 500
    
    cliff_events = [e for e in events if e["media_time_ms"] == 37000]
    assert len(cliff_events) >= 7

def test_telemetry_reaction_events_ingestion():
    sid1 = str(uuid.uuid4())
    client.post("/api/v1/screenings/consent", json={
        "session_id": sid1,
        "screening_token": "demo_token_123",
        "respondent_cohort": "18_24",
        "consent_given": True
    })

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

    sid2 = str(uuid.uuid4())
    client.post("/api/v1/screenings/consent", json={
        "session_id": sid2,
        "screening_token": "demo_token_123",
        "respondent_cohort": "25_34",
        "consent_given": True
    })

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

def test_reaction_idempotent_across_requests():
    from backend.services.clickhouse import get_client, get_db_name
    ch = get_client()
    db = get_db_name()
    sid = str(uuid.uuid4())
    client.post("/api/v1/screenings/consent", json={
        "session_id": sid,
        "screening_token": "demo_token_123",
        "respondent_cohort": "18_24",
        "consent_given": True
    })

    body = {
        "session_id": sid,
        "project_id": "proj_northlight_01",
        "experiment_id": "exp_23a",
        "scene_id": "sc_12",
        "media_time_ms": 37000,
        "reaction_type": "confused"
    }

    res1 = client.post("/api/v1/telemetry/events", json=body)
    assert res1.status_code == 201
    assert res1.json()["status"] == "SUCCESS"
    assert res1.json()["inserted_count"] == 1

    res2 = client.post("/api/v1/telemetry/events", json=body)
    assert res2.status_code == 201
    assert res2.json()["inserted_count"] == 0

    q_res = ch.query(f"SELECT count() FROM {db}.reaction_events WHERE session_id=toUUID('{sid}')")
    assert q_res.result_rows[0][0] == 1


