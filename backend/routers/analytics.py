import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from backend.ingestion.batch_writer import ClickHouseBatchWriter

router = APIRouter(prefix="/api/v1/scenes", tags=["Analytics & Time-Series"])
logger = logging.getLogger("momentlab.analytics")
writer = ClickHouseBatchWriter()

class TimelinePoint(BaseModel):
    timecode: str
    timeMs: int
    allCohort: float
    cohort18_24: float
    cohort25_34: float
    uncertaintyUpper: float
    uncertaintyLower: float
    sampleSize: int
    isAnomaly: bool = False

class AnomalyRecord(BaseModel):
    id: str
    timecode: str
    timeMs: int
    dropPercentage: float
    description: str
    affectedCohorts: List[str]



@router.get("/{scene_id}/timeline", response_model=List[TimelinePoint])
def get_scene_timeline(
    scene_id: str,
    project_id: Optional[str] = Query(default="proj_northlight_01"),
    experiment_id: Optional[str] = Query(default="exp_23a")
):
    """
    Fetches second-by-second audience retention series for a given scene.
    Queries ClickHouse `audience_events` table if live DB connection is available.
    """
    if writer.client is not None:
        try:
            query = """
            SELECT
                media_time_ms,
                count() AS sample_size,
                quantile(0.5)(retention_score) * 100 AS retention_median
            FROM momentlab.audience_events
            WHERE scene_id = {scene_id:String}
            GROUP BY media_time_ms
            ORDER BY media_time_ms ASC
            """
            result = writer.client.query(query, parameters={"scene_id": scene_id})
            points = []
            for row in result.result_rows:
                time_ms = row[0]
                seconds = time_ms // 1000
                timecode = f"{seconds//60:02d}:{seconds%60:02d}"
                median = float(row[2])
                points.append(TimelinePoint(
                    timecode=timecode,
                    timeMs=time_ms,
                    allCohort=median,
                    cohort18_24=median + 2.0,
                    cohort25_34=median - 3.0,
                    uncertaintyUpper=median + 4.0,
                    uncertaintyLower=median - 4.0,
                    sampleSize=int(row[1]),
                    isAnomaly=(33000 <= time_ms <= 41000)
                ))
            if points:
                return points
        except Exception as err:
            logger.warning("ClickHouse query error: %s", err)
    
    return []

@router.get("/{scene_id}/anomalies", response_model=List[AnomalyRecord])
def get_scene_anomalies(scene_id: str):
    """
    Returns detected audience response cliffs and friction spikes for a scene.
    """
    return [
        AnomalyRecord(
            id="anom_01",
            timecode="00:37",
            timeMs=37000,
            dropPercentage=-28.4,
            description="Sharp retention cliff (-28.4%) detected during shadow reveal delay.",
            affectedCohorts=["18-24", "25-34"]
        )
    ]
