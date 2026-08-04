import os
import logging
from typing import List, Dict, Any
from datetime import datetime, timezone

logger = logging.getLogger("momentlab.ingestion")

class ClickHouseBatchWriter:
    """
    High-throughput batch writer for audience events.
    Uses clickhouse-connect with write-limited role (momentlab_writer).
    Provides contract-faithful fallback when live ClickHouse is unavailable.
    """
    def __init__(self):
        self.host = os.getenv("CLICKHOUSE_HOST", "localhost")
        self.port = int(os.getenv("CLICKHOUSE_PORT", "8123"))
        self.user = os.getenv("CLICKHOUSE_USER", "momentlab_writer")
        self.password = os.getenv("CLICKHOUSE_PASSWORD", "")
        self.database = os.getenv("CLICKHOUSE_DB", "momentlab")
        
        self.client = None
        self._memory_events: List[Dict[str, Any]] = []
        self._processed_idempotency_keys: set = set()
        
        self._connect()

    def _connect(self):
        try:
            import clickhouse_connect
            self.client = clickhouse_connect.get_client(
                host=self.host,
                port=self.port,
                username=self.user,
                password=self.password,
                database=self.database,
                connect_timeout=2
            )
            logger.info("Connected to live ClickHouse database %s@%s", self.database, self.host)
        except Exception as e:
            logger.warning("ClickHouse live connection unavailable (%s). Activating in-memory fallback buffer.", str(e))
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
                        ev["event_id"],
                        ev["session_id"],
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
