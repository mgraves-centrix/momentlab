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
    Session-level fixture that initializes ClickHouse schema and seeds baseline session data.
    """
    from backend.services.clickhouse import init_db
    init_db()
    yield

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
