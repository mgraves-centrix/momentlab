from unittest.mock import patch, MagicMock
import os
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
        response = client.post(
            "/api/v1/projects/proj_northlight_01/experiments/exp_23a/generate-hypothesis",
            headers={"Authorization": "Bearer valid_reviewer_token_123"}
        )
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
        "evidenceRecords": [
            {
                "id": "ev_01",
                "timestamp": "00:37",
                "metric": "Response cliff",
                "segment": "ALL",
                "window": "00:33-00:41",
                "effectSize": "-28%",
                "significance": "p < 0.01",
                "sourceQueryRunId": "sample_query_run_01"
            }
        ],
        "trace": {"runId": "trace_01", "totalDurationMs": 120, "steps": []},
        "status": "PROPOSED",
        "isSimulated": True
    }
    with patch("backend.routers.hypotheses.generate_hypothesis", return_value=mock_payload):
        response = client.post(
            "/api/v1/projects/proj_northlight_01/experiments/exp_23a/generate-hypothesis",
            headers={"Authorization": "Bearer valid_reviewer_token_123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["hypothesis"]["confidenceScore"] == 92
        assert data["hypothesis"]["proposedChange"] == "Move reveal earlier"
        assert len(data["hypothesis"]["evidenceRecords"]) == 1


def test_telemetry_timeline_database_outage_returns_503():
    from unittest.mock import patch
    with patch("backend.services.clickhouse.get_client", side_effect=RuntimeError("Connection refused: ClickHouse down")):
        response = client.get("/api/v1/telemetry/timeline?project_id=proj_northlight_01&experiment_id=exp_23a")
        assert response.status_code == 503
        assert "Telemetry database unavailable" in response.json()["detail"]

def test_telemetry_queries_database_outage_returns_503():
    from unittest.mock import patch
    with patch("backend.services.clickhouse.get_client", side_effect=RuntimeError("Connection refused: ClickHouse down")):
        response = client.get("/api/v1/telemetry/queries")
        assert response.status_code == 503
        assert "Telemetry query log unavailable" in response.json()["detail"]

def test_telemetry_summary_database_outage_returns_503():
    from unittest.mock import patch
    with patch("backend.services.clickhouse.get_client", side_effect=RuntimeError("Connection refused: ClickHouse down")):
        response = client.get("/api/v1/telemetry/summary?project_id=proj_northlight_01&experiment_id=exp_23a")
        assert response.status_code == 503
        assert "Telemetry summary unavailable" in response.json()["detail"]

def test_telemetry_timeline_cohort_null_without_fabrication():
    from unittest.mock import patch, MagicMock
    mock_client = MagicMock()
    # Row format: [time_bucket, total_events, avg_all, avg_18_24, avg_25_34, avg_35_44, avg_45_plus, avg_sq]
    # Here avg_18_24 is None (no 18-24 respondents), avg_all is 72.5
    mock_client.query.return_value.result_rows = [
        [37000.0, 10, 72.5, None, 68.0, None, None, 5400.0]
    ]
    with patch("backend.services.clickhouse.get_client", return_value=mock_client):
        response = client.get("/api/v1/telemetry/timeline?project_id=proj_northlight_01&experiment_id=exp_23a&cohort=18_24")
        assert response.status_code == 200
        rows = response.json()
        assert len(rows) == 1
        # Must report null for 18-24 cohort, NOT substitute 72.5 from all_cohort
        assert rows[0]["cohort_18_24"] is None
        assert rows[0]["avg_value"] is None
        assert rows[0]["all_cohort"] == 72.5
        assert rows[0]["cohort_25_34"] == 68.0


def test_telemetry_timeline_cohort_45_plus_returns_non_null():
    """P76 regression test: single-cohort timeline branch with cohort=45_plus reads index 6 correctly and returns non-null avg_value."""
    from unittest.mock import patch, MagicMock
    mock_client = MagicMock()
    # Row format: [time_bucket, total_events, avg_all, avg_18_24, avg_25_34, avg_35_44, avg_45_plus, avg_sq]
    mock_client.query.return_value.result_rows = [
        [1000.0, 15, 75.0, 70.0, 72.0, 78.0, 80.0, 5600.0]
    ]
    with patch("backend.services.clickhouse.get_client", return_value=mock_client):
        response = client.get("/api/v1/telemetry/timeline?project_id=proj_northlight_01&experiment_id=exp_23a&cohort=45_plus")
        assert response.status_code == 200
        rows = response.json()
        assert len(rows) == 1
        assert rows[0]["cohort_45_plus"] == 80.0
        assert rows[0]["avg_value"] == 80.0
        assert rows[0]["all_cohort"] == 75.0


def test_telemetry_query_by_id_cluster_replica_resolution():
    """Regression test for P15: click-through endpoint resolves query_id via clusterAllReplicas even if local replica has 0 rows."""
    from unittest.mock import patch, MagicMock
    mock_client = MagicMock()

    def mock_query(sql, parameters=None):
        mock_res = MagicMock()
        if "clusterAllReplicas" in sql:
            # Cluster read finds the query (e.g. from non-local replica)
            mock_res.result_rows = [
                ("8928b3a4-2d4a-438c-84db-db51eedb7566", "2026-09-04 22:15:00", "SELECT * FROM momentlab.audience_events", 150, 12)
            ]
        else:
            # Local read would return empty (0 rows)
            mock_res.result_rows = []
        return mock_res

    mock_client.query.side_effect = mock_query

    with patch("backend.services.clickhouse.get_client", return_value=mock_client):
        response = client.get("/api/v1/telemetry/queries/8928b3a4-2d4a-438c-84db-db51eedb7566")
        assert response.status_code == 200
        data = response.json()
        assert data["query_id"] == "8928b3a4-2d4a-438c-84db-db51eedb7566"
        assert data["rows"] == 150
        assert "audience_events" in data["query"]


def test_telemetry_query_by_id_cluster_fallback_to_local():
    """Test that if clusterAllReplicas raises an exception, get_query_by_id falls back to system.query_log."""
    from unittest.mock import patch, MagicMock
    mock_client = MagicMock()

    def mock_query(sql, parameters=None):
        if "clusterAllReplicas" in sql:
            raise Exception("UNKNOWN_FUNCTION clusterAllReplicas")
        mock_res = MagicMock()
        mock_res.result_rows = [
            ("local-q-123", "2026-09-04 22:15:00", "SELECT * FROM momentlab.audience_events", 100, 10)
        ]
        return mock_res

    mock_client.query.side_effect = mock_query

    with patch("backend.services.clickhouse.get_client", return_value=mock_client):
        response = client.get("/api/v1/telemetry/queries/local-q-123")
        assert response.status_code == 200
        data = response.json()
        assert data["query_id"] == "local-q-123"
        assert data["rows"] == 100


def test_telemetry_queries_filtering_and_empty_state():
    """Test P23: get_recent_queries filters by user='momentlab_mcp_reader', SELECT queries, excluding momentlab_test and probes, and returns [] when empty."""
    from unittest.mock import patch, MagicMock
    mock_client = MagicMock()

    executed_sql = []
    def mock_query(sql, parameters=None):
        executed_sql.append(sql)
        mock_res = MagicMock()
        mock_res.result_rows = []
        return mock_res

    mock_client.query.side_effect = mock_query

    with patch("backend.services.clickhouse.get_client", return_value=mock_client):
        response = client.get("/api/v1/telemetry/queries")
        assert response.status_code == 200
        data = response.json()
        assert data == []
        assert len(executed_sql) >= 1
        sql = executed_sql[0]
        assert "user = 'momentlab_mcp_reader'" in sql
        assert "momentlab_test" in sql
        assert "SELECT 1" in sql
        assert "version()" in sql
        assert "currentUser()" in sql

def test_render_variant_requires_auth():
    """Verifies that POST render-variant requires authentication."""
    response = client.post("/api/v1/projects/proj_northlight_01/experiments/exp_23a/render-variant")
    assert response.status_code == 401


def test_render_variant_no_anomaly():
    """Verifies that render-variant for proj_echoes_02 returns NO_ANOMALY status."""
    response = client.post(
        "/api/v1/projects/proj_echoes_02/experiments/exp_23a/render-variant",
        headers={"Authorization": "Bearer valid_reviewer_token_123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "NO_ANOMALY"
    assert data["rendered"] is False
    assert data["variant_url"] is None


def test_render_variant_anomaly_window_resolves_os_names(isolate_firestore):
    """Verifies that render_variant executes os module code paths when an anomaly window exists without NameError."""
    isolate_firestore.collection("projects").document("proj_northlight_01").collection("experiments").document("exp_23a").collection("hypotheses").document("current").set({"anomalyWindow": "00:10-00:20"})
    response = client.post(
        "/api/v1/projects/proj_northlight_01/experiments/exp_23a/render-variant",
        headers={"Authorization": "Bearer valid_reviewer_token_123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["rendered"] is True
    assert data["variant_url"] is not None


def test_veo_generation_route_is_absent():
    """Asserts that POST /api/v1/media/veo-generate is absent (not a live route, returns 404/405, never 200 or 401)."""
    response = client.post(
        "/api/v1/media/veo-generate",
        json={"prompt": "test", "duration_seconds": 5},
        headers={"Authorization": "Bearer valid_reviewer_token_123"}
    )
    assert response.status_code not in (200, 401)
    assert response.status_code in (404, 405)


def test_get_variant_unauthenticated_ready(isolate_firestore):
    """Verifies GET .../variant returns 200 READY with NO auth when variant exists in mocked GCS bucket."""
    isolate_firestore.collection("projects").document("proj_northlight_01").collection("experiments").document("exp_23a").collection("hypotheses").document("current").set({"anomalyWindow": "00:10-00:20"})

    mock_blob = MagicMock()
    mock_blob.exists.return_value = True
    mock_blob.generate_signed_url.return_value = "https://storage.googleapis.com/mock-signed-url"

    mock_bucket = MagicMock()
    mock_bucket.blob.return_value = mock_blob

    mock_storage = MagicMock()
    mock_storage.bucket.return_value = mock_bucket

    mock_creds = MagicMock()
    mock_creds.valid = True
    mock_creds.service_account_email = "test-sa@project.iam.gserviceaccount.com"
    mock_creds.token = "mock_token"

    with patch("backend.routers.projects._get_storage_client", return_value=mock_storage), \
         patch("backend.routers.projects._get_asset_bucket_name", return_value="momentlab-504305-media"), \
         patch("google.auth.default", return_value=(mock_creds, "test-project")), \
         patch("subprocess.run") as mock_subprocess:

        response = client.get("/api/v1/projects/proj_northlight_01/experiments/exp_23a/variant")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "READY"
        assert data["variant_url"] == "https://storage.googleapis.com/mock-signed-url"
        
        # Assert ffmpeg command was never invoked
        for call in mock_subprocess.call_args_list:
            args = call[0][0] if call[0] else []
            assert "ffmpeg" not in args


def test_get_variant_unauthenticated_not_rendered(isolate_firestore):
    """Verifies GET .../variant returns 200 NOT_RENDERED when variant does not exist."""
    isolate_firestore.collection("projects").document("proj_northlight_01").collection("experiments").document("exp_23a").collection("hypotheses").document("current").set({"anomalyWindow": "00:10-00:20"})

    mock_blob = MagicMock()
    mock_blob.exists.return_value = False

    mock_bucket = MagicMock()
    mock_bucket.blob.return_value = mock_blob

    mock_storage = MagicMock()
    mock_storage.bucket.return_value = mock_bucket

    mock_creds = MagicMock()
    mock_creds.valid = True
    mock_creds.service_account_email = "test-sa@project.iam.gserviceaccount.com"

    orig_exists = os.path.exists
    def mock_exists(path):
        if "scene_cut_b.mp4" in str(path):
            return False
        return orig_exists(path)

    with patch("backend.routers.projects._get_storage_client", return_value=mock_storage), \
         patch("backend.routers.projects._get_asset_bucket_name", return_value="momentlab-504305-media"), \
         patch("google.auth.default", return_value=(mock_creds, "test-project")), \
         patch("os.path.exists", side_effect=mock_exists), \
         patch("subprocess.run") as mock_subprocess:

        response = client.get("/api/v1/projects/proj_northlight_01/experiments/exp_23a/variant")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "NOT_RENDERED"
        assert data["variant_url"] is None

        for call in mock_subprocess.call_args_list:
            args = call[0][0] if call[0] else []
            assert "ffmpeg" not in args


def test_get_variant_unauthenticated_no_anomaly():
    """Verifies GET .../variant returns 200 NO_ANOMALY when project has no anomaly window."""
    with patch("subprocess.run") as mock_subprocess:
        response = client.get("/api/v1/projects/proj_echoes_02/experiments/exp_23a/variant")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "NO_ANOMALY"
        assert data["variant_url"] is None
        
        for call in mock_subprocess.call_args_list:
            args = call[0][0] if call[0] else []
            assert "ffmpeg" not in args










