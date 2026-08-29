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
    return str(uuid.UUID(str(val)))

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

    def insert_screening_sessions(self, sessions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Inserts session records into screening_sessions.
        """
        if not sessions:
            return {"status": "EMPTY", "inserted_count": 0}

        if self.client:
            try:
                data = [
                    [
                        _ensure_uuid(s.get("session_id")),
                        s.get("screening_token", f"tok_{str(s.get('session_id'))[:8]}"),
                        s["project_id"],
                        s["experiment_id"],
                        s["scene_id"],
                        s["respondent_cohort"],
                        int(s.get("consent_given", 1)),
                        s.get("consent_timestamp", datetime.now(timezone.utc)),
                        s.get("created_at", datetime.now(timezone.utc))
                    ]
                    for s in sessions
                ]
                self.client.insert(
                    "screening_sessions",
                    data,
                    column_names=[
                        "session_id", "screening_token", "project_id", "experiment_id",
                        "scene_id", "respondent_cohort", "consent_given",
                        "consent_timestamp", "created_at"
                    ]
                )
                return {"status": "SUCCESS", "inserted_count": len(sessions)}
            except Exception as e:
                logger.error("ClickHouse session insert error: %s", str(e))
    def insert_reaction_events(self, reactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Inserts reaction events (CONFUSED, ENGAGING, BORED, etc.) into reaction_events.
        Enforces idempotency deduplication.
        """
        new_reactions = []
        for r in reactions:
            session_id = str(r.get("session_id") or "")
            media_time = int(r.get("media_time_ms", 0))
            rxn_type = str(r.get("reaction_type") or r.get("event_type") or "ENGAGED")
            key = r.get("idempotency_key") or f"{session_id}:{media_time}:{rxn_type}"
            r["idempotency_key"] = key
            if key in self._processed_idempotency_keys:
                continue
            self._processed_idempotency_keys.add(key)
            new_reactions.append(r)

        if not new_reactions:
            return {"status": "DUPLICATE", "inserted_count": 0}

        if self.client:
            try:
                data = [
                    [
                        _ensure_uuid(r.get("reaction_id")),
                        _ensure_uuid(r.get("session_id")),
                        str(r.get("project_id") or "proj_northlight_01"),
                        str(r.get("experiment_id") or "exp_23a"),
                        str(r.get("scene_id") or "sc_12"),
                        int(r.get("media_time_ms", 0)),
                        str(r.get("reaction_type") or r.get("event_type") or "ENGAGED"),
                        str(r.get("idempotency_key")),
                        datetime.now(timezone.utc)
                    ]
                    for r in new_reactions
                ]
                self.client.insert(
                    "reaction_events",
                    data,
                    column_names=[
                        "reaction_id", "session_id", "project_id", "experiment_id",
                        "scene_id", "media_time_ms", "reaction_type",
                        "idempotency_key", "created_at"
                    ]
                )
                return {"status": "SUCCESS", "inserted_count": len(new_reactions)}
            except Exception as e:
                logger.error("ClickHouse reaction insert error: %s", str(e))
                return {"status": "ERROR", "inserted_count": 0, "error": str(e)}
        return {"status": "SUCCESS", "inserted_count": len(new_reactions)}

    def get_buffered_event_count(self) -> int:
        return len(self._memory_events)

