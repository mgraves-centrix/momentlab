import os
import re
import uuid
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from backend.services.db import get_db
from backend.services.veo_pipeline import (
    discover_available_veo_models,
    generate_multi_clip_veo_sequence
)

logger = logging.getLogger("momentlab.media")

router = APIRouter(prefix="/api/v1/media", tags=["Media"])

class VeoGenerateRequest(BaseModel):
    prompt: Optional[str] = "Scene 12 INT. APARTMENT - NIGHT. Cinematic lighting, dramatic pause, film grain."
    project_id: Optional[str] = "proj_northlight_01"
    target_duration_sec: Optional[int] = 61

class YouTubeIngestRequest(BaseModel):
    youtube_url: str
    project_id: str
    scene_name: Optional[str] = "YouTube Ingested Scene"

class YouTubeIngestResponse(BaseModel):
    status: str
    video_id: str
    embed_url: str
    scene_id: str
    project_id: str
    title: str

def extract_youtube_video_id(url: str) -> Optional[str]:
    patterns = [
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})',
        r'(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})'
    ]
    for p in patterns:
        match = re.search(p, url)
        if match:
            return match.group(1)
    return None

@router.get("/veo-models")
def list_veo_models(project_id: Optional[str] = None):
    """
    Returns the live Model Garden Veo access and region discovery matrix.
    """
    proj = project_id or os.getenv("GCP_PROJECT_ID", "guarded-ops")
    return {
        "project_id": proj,
        "models": discover_available_veo_models(proj)
    }

@router.post("/veo-generate")
async def generate_veo_media(req: Optional[VeoGenerateRequest] = None):
    """
    Triggers Google Veo multi-clip generative video pipeline on Vertex AI to produce a synthetic film scene.
    Stitches clips server-side into a continuous asset covering the analyzed window.
    Labels generated output as SYNTHETIC.
    If Vertex AI Veo quota is unavailable, returns an honest BLOCKED status detailing exact allowlist steps.
    """
    prompt = req.prompt if req else "Scene 12 INT. APARTMENT - NIGHT"
    target_dur = req.target_duration_sec if req else 61
    project_id = os.getenv("GCP_PROJECT_ID", os.getenv("GOOGLE_CLOUD_PROJECT", "guarded-ops"))
    location = os.getenv("GCP_LOCATION", "us-central1")
    
    return generate_multi_clip_veo_sequence(
        prompt=prompt,
        target_duration_sec=target_dur,
        project_id=project_id,
        location=location
    )

@router.post("/youtube-ingest", response_model=YouTubeIngestResponse)
async def ingest_youtube_video(req: YouTubeIngestRequest):
    """
    Ingests a YouTube video for private audience telemetry instrumentation using YouTube IFrame Player API.
    Does not rehost copyrighted video. Stores canonical embed URL and scene metadata.
    """
    video_id = extract_youtube_video_id(req.youtube_url)
    if not video_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid YouTube URL. Please provide a valid YouTube video watch or youtu.be link."
        )
    
    scene_id = f"yt_{video_id}"
    embed_url = f"https://www.youtube.com/embed/{video_id}?enablejsapi=1&origin=http://localhost:3000"
    
    db = get_db()
    project_ref = db.collection('projects').document(req.project_id)
    if not project_ref.get().exists:
        raise HTTPException(status_code=404, detail=f"Project '{req.project_id}' not found.")
    
    scene_data = {
        "scene_id": scene_id,
        "video_id": video_id,
        "video_source": "YOUTUBE_IFRAME",
        "embed_url": embed_url,
        "title": req.scene_name,
        "youtube_url": req.youtube_url,
        "ingested_at": str(uuid.uuid4())
    }
    
    project_ref.collection('scenes').document(scene_id).set(scene_data)
    
    return YouTubeIngestResponse(
        status="INGESTED",
        video_id=video_id,
        embed_url=embed_url,
        scene_id=scene_id,
        project_id=req.project_id,
        title=req.scene_name
    )
