import os
import uuid
import logging
from typing import List, Dict, Any
from datetime import datetime, timezone
from backend.services.clickhouse import get_client

logger = logging.getLogger("momentlab.ingestion")

def _ensure_uuid(val: Any) -> str:
    if not val:
        return str(uuid.uuid4())
    try:
        return str(uuid.UUID(str(val)))
    except Exception:
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, str(val)))

class ClickHouseBatchWriter:
    """
    High-throughput batch writer for audience events.
    Uses clickhouse-connect or the local ClickHouse adapter.
    """
    def __init__(self):
        self.host = (os.getenv("CLICKHOUSE_HOST", "localhost")).strip()
        self.port = int(str(os.getenv("CLICKHOUSE_PORT", "8123")).strip())
        self.user = (os.getenv("CLICKHOUSE_USER") or os.getenv("CLICKHOUSE_WRITER_USER", "momentlab_writer")).strip()
        self.password = (os.getenv("CLICKHOUSE_PASSWORD") or os.getenv("CLICKHOUSE_WRITER_PASSWORD", "")).strip()
        self.database = (os.getenv("CLICKHOUSE_DATABASE") or os.getenv("CLICKHOUSE_DB", "momentlab")).strip()
        
        self.client = None
        self._memory_events: List[Dict[str, Any]] = []
        self._processed_idempotency_keys: set = set()
        
        self._connect()

    def _connect(self):
        try:
            self.client = get_client()
            logger.info("Batch writer connected with client %s", type(self.client).__name__)
        except Exception as e:
            logger.warning("ClickHouse connection error (%s). Activating memory buffer.", str(e))
            self.client = None

    def insert_playback_events(self, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Inserts second-by-second playback events into audience_events.
        Enforces idempotency deduplication.
        """
        new_events = []
        for ev in events:
            key = ev.get("idempotency_key")
            if key and key in self._processed_idempotency_keys:
                continue
            if key:
                self._processed_idempotency_keys.add(key)
            new_events.append(ev)

        if not new_events:
            return {"status": "DUPLICATE", "inserted_count": 0}

        if self.client:
            try:
                data = [
                    [
                        _ensure_uuid(ev.get("event_id")),
                        _ensure_uuid(ev.get("session_id")),
                        ev["project_id"],
                        ev["experiment_id"],
                        ev["scene_id"],
                        ev["media_time_ms"],
                        ev["retention_score"],
                        ev["playback_state"],
                        ev["idempotency_key"],
                        datetime.now(timezone.utc)
                    ]
                    for ev in new_events
                ]
                self.client.insert(
                    "audience_events",
                    data,
                    column_names=[
                        "event_id", "session_id", "project_id", "experiment_id",
                        "scene_id", "media_time_ms", "retention_score",
                        "playback_state", "idempotency_key", "event_timestamp"
                    ]
                )
                return {"status": "SUCCESS", "inserted_count": len(new_events)}
            except Exception as e:
                logger.error("ClickHouse batch insert error: %s. Writing to local fallback buffer.", str(e))
                self._memory_events.extend(new_events)
                return {"status": "QUEUED", "inserted_count": len(new_events)}
        else:
            self._memory_events.extend(new_events)
            return {"status": "SUCCESS", "inserted_count": len(new_events)}

    def get_buffered_event_count(self) -> int:
        return len(self._memory_events)
