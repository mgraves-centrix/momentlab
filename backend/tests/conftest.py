import os
import pytest
from unittest.mock import MagicMock
from backend.services.clickhouse import get_client
from backend.simulator.fixtures import generate_northlight_events_and_sessions
from backend.ingestion.batch_writer import ClickHouseBatchWriter

os.environ.setdefault("REVIEWER_TOKENS", "valid_reviewer_token_123")

@pytest.fixture(scope="session", autouse=True)
def setup_test_clickhouse_db():
    """
    Session-level fixture that provisions an isolated momentlab_test database in ClickHouse,
    seeds baseline session & timeline data, and cleans up at session end.
    Guarantees default pytest run writes ZERO rows to momentlab (production).
    Fails loudly if database setup fails.
    """
    try:
        os.environ["CLICKHOUSE_DB"] = "momentlab"
        os.environ["CLICKHOUSE_DATABASE"] = "momentlab"
        init_client = get_client()
        init_client.query("CREATE DATABASE IF NOT EXISTS momentlab_test")

        os.environ["CLICKHOUSE_DB"] = "momentlab_test"
        os.environ["CLICKHOUSE_DATABASE"] = "momentlab_test"

        client = get_client(database="momentlab_test")
        
        # Provision tables in momentlab_test
        client.query("""
            CREATE TABLE IF NOT EXISTS momentlab_test.screening_sessions (
                session_id UUID,
                screening_token String,
                project_id String,
                experiment_id String,
                scene_id String,
                respondent_cohort String,
                consent_given UInt8,
                consent_timestamp DateTime64(3, 'UTC'),
                created_at DateTime64(3, 'UTC') DEFAULT now64()
            ) ENGINE = MergeTree()
            ORDER BY (project_id, experiment_id, session_id);
        """)
        client.query("""
            CREATE TABLE IF NOT EXISTS momentlab_test.audience_events (
                event_id UUID,
                session_id UUID,
                project_id String,
                experiment_id String,
                scene_id String,
                media_time_ms UInt32,
                retention_score Float32,
                playback_state String,
                idempotency_key String,
                event_timestamp DateTime64(3, 'UTC')
            ) ENGINE = MergeTree()
            ORDER BY (project_id, scene_id, media_time_ms, event_timestamp);
        """)
        client.query("""
            CREATE TABLE IF NOT EXISTS momentlab_test.reaction_events (
                reaction_id UUID,
                session_id UUID,
                project_id String,
                experiment_id String,
                scene_id String,
                media_time_ms UInt32,
                reaction_type String,
                idempotency_key String,
                created_at DateTime64(3, 'UTC') DEFAULT now64()
            ) ENGINE = MergeTree()
            ORDER BY (project_id, scene_id, media_time_ms, reaction_type);
        """)

        # Seed initial baseline in momentlab_test for timeline/summary unit tests
        events, sessions = generate_northlight_events_and_sessions(count=525)
        # Add seeded demo_token_123 invite row
        from datetime import datetime, timezone
        sessions.insert(0, {
            "session_id": "00000000-0000-0000-0000-000000000000",
            "screening_token": "demo_token_123",
            "project_id": "proj_northlight_01",
            "experiment_id": "exp_23a",
            "scene_id": "sc_12",
            "respondent_cohort": "25_34",
            "consent_given": 0,
            "consent_timestamp": datetime.now(timezone.utc),
            "created_at": datetime.now(timezone.utc)
        })
        writer = ClickHouseBatchWriter(database="momentlab_test")
        writer.insert_screening_sessions(sessions)
        writer.insert_playback_events(events)
        writer.flush()
    except Exception as e:
        pytest.fail(f"Failed setting up momentlab_test ClickHouse database: {e}")

    yield

    try:
        client = get_client(database="default")
        client.query("DROP DATABASE IF EXISTS momentlab_test")
    except Exception as e:
        print("Warning dropping momentlab_test ClickHouse database:", e)

@pytest.fixture(autouse=True)
def isolate_firestore(monkeypatch):
    """
    Autouse fixture that mocks Firestore get_db() for unit tests.
    Guarantees ZERO documents are written to production Firestore project during pytest.
    """
    store: dict = {
        "projects/proj_northlight_01": {"project_id": "proj_northlight_01", "title": "Project Northlight", "description": "Scene 12 Cut A audience screening test", "owner_id": "user_prod_01"},
        "projects/proj_echoes_02": {"project_id": "proj_echoes_02", "title": "Echoes of Salt", "description": "Atmospheric drama test", "owner_id": "user_prod_01"},
        "projects/proj_below_03": {"project_id": "proj_below_03", "title": "Below the Surface", "description": "Thriller sequence test", "owner_id": "user_prod_01"},
    }

    class MockDocumentRef:
        def __init__(self, doc_path: str):
            self.doc_path = doc_path

        def get(self):
            mock_snap = MagicMock()
            mock_snap.exists = self.doc_path in store
            mock_snap.to_dict.return_value = store.get(self.doc_path, {})
            return mock_snap

        def set(self, data: dict, merge: bool = False):
            if merge and self.doc_path in store:
                store[self.doc_path].update(data)
            else:
                store[self.doc_path] = dict(data)

        def delete(self):
            store.pop(self.doc_path, None)

        def collection(self, name: str):
            return MockCollectionRef(f"{self.col_path if hasattr(self, 'col_path') else self.doc_path}/{name}")

    class MockCollectionRef:
        def __init__(self, col_path: str):
            self.col_path = col_path

        def document(self, name: str):
            return MockDocumentRef(f"{self.col_path}/{name}")

        def get(self):
            results = []
            prefix = f"{self.col_path}/"
            for k, v in store.items():
                if k.startswith(prefix) and "/" not in k[len(prefix):]:
                    mock_snap = MagicMock()
                    mock_snap.exists = True
                    mock_snap.to_dict.return_value = v
                    mock_snap.id = k.split("/")[-1]
                    results.append(mock_snap)
            return results

        def stream(self):
            return self.get()

    class MockFirestoreClient:
        def collection(self, name: str):
            return MockCollectionRef(name)

    mock_db = MockFirestoreClient()
    monkeypatch.setattr("backend.services.db.get_db", lambda: mock_db)
    return mock_db
