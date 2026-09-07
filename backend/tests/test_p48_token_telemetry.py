import pytest
import uuid
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.clickhouse import resolve_screening_token, is_valid_screening_token, get_client, get_db_name

client = TestClient(app)

def test_resolve_screening_tokens():
    res_north = resolve_screening_token("demo_token_123")
    assert res_north is not None
    assert res_north["project_id"] == "proj_northlight_01"
    assert res_north["experiment_id"] == "exp_23a"
    assert res_north["scene_id"] == "sc_12"

    res_echoes = resolve_screening_token("demo_token_echoes")
    assert res_echoes is not None
    assert res_echoes["project_id"] == "proj_echoes_02"
    assert res_echoes["experiment_id"] == "exp_01b"
    assert res_echoes["scene_id"] == "sc_01"

    res_below = resolve_screening_token("demo_token_below")
    assert res_below is not None
    assert res_below["project_id"] == "proj_below_03"
    assert res_below["experiment_id"] == "exp_01c"
    assert res_below["scene_id"] == "sc_01"

    assert resolve_screening_token("unknown_garbage_token_999") is None

def test_screening_token_endpoint():
    res = client.get("/api/v1/screenings/demo_token_123")
    assert res.status_code == 200
    data = res.json()
    assert data["project_id"] == "proj_northlight_01"
    assert data["experiment_id"] == "exp_23a"
    assert data["scene_id"] == "sc_12"

    res_invalid = client.get("/api/v1/screenings/unknown_token_abc")
    assert res_invalid.status_code == 404

def test_consent_registration_with_token_resolution():
    sid = str(uuid.uuid4())
    res = client.post("/api/v1/screenings/consent", json={
        "session_id": sid,
        "screening_token": "demo_token_echoes",
        "project_id": "proj_northlight_01",  # client passing wrong project_id
        "experiment_id": "exp_23a",
        "scene_id": "sc_12",
        "respondent_cohort": "25_34",
        "consent_given": True
    })
    assert res.status_code == 200
    data = res.json()
    # Verified token MUST bind the actual project_id and experiment_id of demo_token_echoes
    assert data["project_id"] == "proj_echoes_02"
    assert data["experiment_id"] == "exp_01b"
    assert data["scene_id"] == "sc_01"
