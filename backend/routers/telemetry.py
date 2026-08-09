from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel
from datetime import datetime
from backend.services.clickhouse import insert_events

router = APIRouter()

class TelemetryEvent(BaseModel):
    session_id: str
    project_id: str
    experiment_id: str
    media_time_ms: int
    event_type: str
    value: float
    timestamp: datetime = None

@router.post("/events")
async def record_events(events: List[TelemetryEvent]):
    try:
        rows = []
        for event in events:
            ts = event.timestamp or datetime.utcnow()
            rows.append((
                ts,
                event.session_id,
                event.project_id,
                event.experiment_id,
                event.media_time_ms,
                event.event_type,
                event.value
            ))
        insert_events(rows)
        return {"status": "ok", "inserted": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/timeline")
async def get_timeline(project_id: str, experiment_id: str):
    try:
        from backend.services.clickhouse import get_client
        client = get_client()
        query = f"""
            SELECT 
                media_time_ms,
                count() as total_events,
                sum(if(event_type = 'ENGAGED', 1, 0)) as engaged,
                sum(if(event_type = 'CONFUSED', 1, 0)) as confused,
                sum(if(event_type = 'FUNNY', 1, 0)) as funny,
                sum(if(event_type = 'TOO SLOW', 1, 0)) as too_slow,
                avg(value) as avg_value
            FROM telemetry_events
            WHERE project_id = '{project_id}' AND experiment_id = '{experiment_id}'
            GROUP BY media_time_ms
            ORDER BY media_time_ms
        """
        result = client.query(query)
        timeline = []
        for row in result.result_rows:
            timeline.append({
                "media_time_ms": row[0],
                "total_events": row[1],
                "engaged": row[2],
                "confused": row[3],
                "funny": row[4],
                "too_slow": row[5],
                "avg_value": row[6]
            })
        return timeline
    except Exception as e:
        # If table missing or db down, return empty
        return []
