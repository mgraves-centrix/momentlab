import os
import sys
import uuid
import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import List, Dict, Any
from datetime import datetime, timezone

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stdout,
    force=True
)
root_logger = logging.getLogger("momentlab")
root_logger.setLevel(logging.INFO)

from backend.schemas.events import ConsentRecord, PlaybackEvent, ReactionEvent, IngestionResponse
from backend.ingestion.batch_writer import ClickHouseBatchWriter
from backend.routers import projects, analytics, export, telemetry
from backend.services.clickhouse import init_db, check_connection, is_session_consented, record_session_consent_cache, is_valid_screening_token

app = FastAPI(
    title="MomentLab API Engine",
    version="0.4.0",
    description="High-throughput audience event ingestion, real-time ClickHouse analytics, Gemini ADK screening control, and NLE Export service."
)

allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,https://momentlab-web-qa24oxtrrq-uc.a.run.app").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(analytics.router)


@app.on_event("startup")
def on_startup():
    try:
        init_db()
    except Exception as e:
        print("ClickHouse init skipped or failed:", e)
app.include_router(export.router)
app.include_router(telemetry.router, prefix="/api/v1/telemetry", tags=["telemetry"])
from backend.routers import hypotheses, experiments
app.include_router(hypotheses.router, prefix="/api/v1", tags=["hypotheses"])
app.include_router(experiments.router, prefix="/api/v1", tags=["experiments"])

writer = ClickHouseBatchWriter()




# Mount static assets if build exists
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.exists(static_dir):
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/health")
def health_check():
    db_health = check_connection(timeout=3)
    is_connected = db_health["connected"]
    res: Dict[str, Any] = {
        "status": "HEALTHY" if is_connected else "UNHEALTHY",
        "git_sha": os.environ.get("GIT_SHA", "unknown"),
        "database_connected": is_connected,
        "database_host": db_health["host"],
        "database_version": db_health["version"],
        "server_version": db_health["version"],
        "buffered_events": writer.get_buffered_event_count()
    }
    if not is_connected and db_health.get("error"):
        res["error"] = db_health["error"]
    return res

@app.post("/api/v1/screenings/consent", response_model=ConsentRecord)
def register_screening_consent(consent: ConsentRecord):
    """
    Registers screening consent. Required before playback events are accepted.
    Enforces ZERO biometric / emotion tracking policy.
    Persists session metadata to screening_sessions table upon consent.
    """
    if not consent.consent_given:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consent is required before audience screening playback can initiate."
        )

    if not is_valid_screening_token(consent.screening_token):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown or expired screening token: '{consent.screening_token}'"
        )

    writer.insert_screening_sessions([{
        "session_id": consent.session_id,
        "screening_token": consent.screening_token,
        "project_id": consent.project_id,
        "experiment_id": consent.experiment_id,
        "scene_id": consent.scene_id,
        "respondent_cohort": consent.respondent_cohort,
        "consent_given": 1,
        "consent_timestamp": consent.consent_timestamp,
        "created_at": datetime.now(timezone.utc)
    }])
    record_session_consent_cache(consent.session_id)
    return consent

@app.post("/api/v1/events/playback", response_model=IngestionResponse)
def ingest_playback_event(event: PlaybackEvent):
    """
    Ingests second-by-second audience playback event into ClickHouse pipeline.
    Requires prior valid consent registration for event.session_id.
    """
    if not is_session_consented(event.session_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Screening consent required before playback telemetry ingestion for session '{event.session_id}'"
        )

    res = writer.insert_playback_events([{
        "event_id": str(uuid.uuid4()),
        "session_id": event.session_id,
        "project_id": event.project_id,
        "experiment_id": event.experiment_id,
        "scene_id": event.scene_id,
        "media_time_ms": event.media_time_ms,
        "retention_score": 0.0,
        "playback_state": event.playback_state,
        "idempotency_key": event.idempotency_key
    }])
    
    return IngestionResponse(
        status=res["status"],
        inserted_count=res["inserted_count"],
        idempotency_key=event.idempotency_key
    )

from backend.routers import media
app.include_router(media.router)

# SPA Catch-all Fallback Route for React Router
@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    if full_path.startswith("api/") or full_path == "health":
        raise HTTPException(status_code=404, detail="Not Found")
    
    # Direct static file check (e.g. media files, images)
    if full_path:
        file_path = os.path.join(static_dir, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
    
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"status": "MomentLab Backend API Live", "message": "Build frontend with 'npm run build' to render React UI."}
