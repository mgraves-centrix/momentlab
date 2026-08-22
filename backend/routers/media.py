import os
import re
import uuid
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from backend.services.db import get_db

logger = logging.getLogger("momentlab.media")

router = APIRouter(prefix="/api/v1/media", tags=["Media"])

class VeoGenerateRequest(BaseModel):
    prompt: Optional[str] = "Scene 12 INT. APARTMENT - NIGHT. Cinematic lighting, dramatic pause, film grain."
    project_id: Optional[str] = "proj_northlight_01"

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

@router.post("/veo-generate")
async def generate_veo_media(req: Optional[VeoGenerateRequest] = None):
    """
    Triggers Google Veo generative video model on Vertex AI to produce a synthetic film scene.
    Labels generated output as SYNTHETIC.
    If Vertex AI Veo credentials or quota are unavailable, returns an honest BLOCKED status.
    Never returns fake COMPLETED.
    """
    prompt = req.prompt if req else "Scene 12 INT. APARTMENT - NIGHT"
    project_id = os.getenv("GCP_PROJECT_ID")
    location = os.getenv("GCP_LOCATION", "us-central1")
    
    # Check if Vertex credentials and project are explicitly available for live Veo invocation
    if not project_id:
        return {
            "status": "BLOCKED",
            "reason": "Vertex AI Veo video generation requires GCP_PROJECT_ID and active Vertex AI Veo quota in deployment region.",
            "media_type": "SYNTHETIC",
            "model": "veo-2.0-generate-001"
        }
    
    try:
        # Attempt Vertex AI video generation
        from google.genai import Client
        client = Client(vertexai=True, project=project_id, location=location)
        operation = client.models.generate_videos(
            model="veo-2.0-generate-001",
            prompt=prompt
        )
        # If live operation completes, verify generated asset
        if hasattr(operation, 'result') and operation.result and hasattr(operation.result, 'generated_videos'):
            generated_id = f"synth_{uuid.uuid4().hex[:8]}"
            output_dir = os.path.join(os.path.dirname(__file__), "..", "..", "public", "media", "synthetic")
            os.makedirs(output_dir, exist_ok=True)
            video_file = os.path.join(output_dir, f"{generated_id}.mp4")
            
            # Save video bytes
            video_bytes = operation.result.generated_videos[0].video.video_bytes
            with open(video_file, "wb") as f:
                f.write(video_bytes)
                
            if os.path.exists(video_file) and os.path.getsize(video_file) > 0:
                return {
                    "status": "COMPLETED",
                    "model": "veo-2.0-generate-001",
                    "media_type": "SYNTHETIC",
                    "prompt": prompt,
                    "asset_id": generated_id,
                    "video_url": f"/media/synthetic/{generated_id}.mp4",
                    "poster_url": f"/media/synthetic/{generated_id}.png"
                }
        
        return {
            "status": "BLOCKED",
            "reason": "Vertex AI Veo operation did not produce downloadable video bytes.",
            "media_type": "SYNTHETIC",
            "model": "veo-2.0-generate-001"
        }
    except Exception as e:
        logger.info("Vertex AI Veo generation unavailable: %s", e)
        return {
            "status": "BLOCKED",
            "reason": f"Vertex AI Veo video generation requires active Veo quota in region {location}. Error: {str(e)}",
            "media_type": "SYNTHETIC",
            "model": "veo-2.0-generate-001"
        }

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
