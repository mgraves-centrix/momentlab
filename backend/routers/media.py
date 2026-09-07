import os
import re
import uuid
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from backend.services import db
from backend.services.gcp_config import get_gcp_project_id, get_gcp_location
from backend.auth_deps import get_current_reviewer

logger = logging.getLogger("momentlab.media")
from backend.services.veo_pipeline import (
    discover_available_veo_models
)

router = APIRouter(prefix="/api/v1/media", tags=["Media"])

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
    proj = get_gcp_project_id(project_id)
    return {
        "project_id": proj,
        "models": discover_available_veo_models(proj)
    }

@router.post("/youtube-ingest", response_model=YouTubeIngestResponse)
async def ingest_youtube_video(req: YouTubeIngestRequest, reviewer_id: str = Depends(get_current_reviewer)):
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
    
    firestore_db = db.get_db()
    project_ref = firestore_db.collection('projects').document(req.project_id)
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
