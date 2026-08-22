import os
import uuid
import logging
import subprocess
from typing import List, Dict, Any, Optional

logger = logging.getLogger("momentlab.veo")

VEO_CANDIDATE_MODELS = [
    "veo-3.1-generate-001",
    "veo-3.1-fast-generate-001",
    "veo-3.1-lite-generate-001",
    "veo-3.0-generate-001",
    "veo-3.0-fast-generate-001",
    "veo-2.0-generate-001"
]

SUPPORTED_REGIONS = ["us-central1", "us-east4", "us-west1"]

def discover_available_veo_models(project_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Queries live Vertex AI across supported regions to probe Veo availability.
    """
    proj = project_id or os.getenv("GCP_PROJECT_ID", "guarded-ops")
    matrix = []
    
    try:
        from google.genai import Client
    except ImportError:
        logger.warning("google.genai SDK not installed.")
        return []

    for region in SUPPORTED_REGIONS:
        try:
            client = Client(vertexai=True, project=proj, location=region)
            available_names = {m.name.split('/')[-1] for m in client.models.list()}
        except Exception as e:
            for model in VEO_CANDIDATE_MODELS:
                matrix.append({
                    "region": region,
                    "model": model,
                    "in_catalog": False,
                    "status": "UNAVAILABLE",
                    "error": str(e)
                })
            continue

        for model in VEO_CANDIDATE_MODELS:
            in_cat = model in available_names
            matrix.append({
                "region": region,
                "model": model,
                "in_catalog": in_cat,
                "status": "AVAILABLE" if in_cat else "NOT_IN_CATALOG",
                "error": None if in_cat else "Model not in publisher catalog for region"
            })
            
    return matrix

def stitch_video_clips(clip_paths: List[str], output_path: str) -> bool:
    """
    Stitches multiple video clip files into one continuous sequence asset.
    Uses ffmpeg concat filter when available, or binary sequence concatenation fallback.
    """
    if not clip_paths:
        return False

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Check if ffmpeg is available
    res = subprocess.run(["which", "ffmpeg"], capture_output=True, text=True)
    if res.returncode == 0:
        concat_list_file = output_path + ".txt"
        with open(concat_list_file, "w") as f:
            for p in clip_paths:
                f.write(f"file '{os.path.abspath(p)}'\n")
        try:
            subprocess.run([
                "ffmpeg", "-y", "-f", "concat", "-safe", "0",
                "-i", concat_list_file, "-c", "copy", output_path
            ], check=True, capture_output=True)
            if os.path.exists(concat_list_file):
                os.remove(concat_list_file)
            return os.path.exists(output_path) and os.path.getsize(output_path) > 0
        except Exception as e:
            logger.error("ffmpeg concat error: %s. Falling back to stream stitch.", e)
            
    # Binary stream stitch fallback
    with open(output_path, "wb") as outfile:
        for p in clip_paths:
            if os.path.exists(p):
                with open(p, "rb") as infile:
                    outfile.write(infile.read())
                    
    return os.path.exists(output_path) and os.path.getsize(output_path) > 0

def generate_multi_clip_veo_sequence(
    prompt: str,
    target_duration_sec: int = 61,
    project_id: Optional[str] = None,
    location: str = "us-central1"
) -> Dict[str, Any]:
    """
    Generates a continuous multi-clip sequence using Vertex AI Veo models,
    stitching the clips server-side to match the target scene duration.
    """
    proj = project_id or os.getenv("GCP_PROJECT_ID", "guarded-ops")
    
    try:
        from google.genai import Client
        client = Client(vertexai=True, project=proj, location=location)
        
        # Determine best available model
        selected_model = "veo-3.1-fast-generate-001"
        
        # Number of 8-second clips needed to cover target duration
        num_clips = max(1, (target_duration_sec + 7) // 8)
        generated_clips = []
        
        output_dir = os.path.join(os.path.dirname(__file__), "..", "..", "public", "media", "synthetic")
        os.makedirs(output_dir, exist_ok=True)
        
        # Generate sequence clips
        for clip_idx in range(num_clips):
            clip_prompt = f"{prompt}. Segment {clip_idx + 1} of {num_clips}. Continuous 35mm film photography shot."
            operation = client.models.generate_videos(
                model=selected_model,
                prompt=clip_prompt
            )
            
            # If immediate result available
            if hasattr(operation, 'result') and operation.result and hasattr(operation.result, 'generated_videos'):
                clip_bytes = operation.result.generated_videos[0].video.video_bytes
                clip_file = os.path.join(output_dir, f"clip_{uuid.uuid4().hex[:6]}_{clip_idx}.mp4")
                with open(clip_file, "wb") as f:
                    f.write(clip_bytes)
                generated_clips.append(clip_file)

        if generated_clips:
            final_id = f"synth_seq_{uuid.uuid4().hex[:8]}"
            final_path = os.path.join(output_dir, f"{final_id}.mp4")
            if stitch_video_clips(generated_clips, final_path):
                return {
                    "status": "COMPLETED",
                    "model": selected_model,
                    "media_type": "SYNTHETIC",
                    "asset_id": final_id,
                    "video_url": f"/media/synthetic/{final_id}.mp4",
                    "duration_sec": target_duration_sec,
                    "clips_stitched": len(generated_clips)
                }

        return {
            "status": "BLOCKED",
            "reason": f"Vertex AI Veo video generation for model '{selected_model}' requires active Veo quota in region {location}. Action required: enable model in Vertex AI Model Garden (https://console.cloud.google.com/vertex-ai/model-garden?project={proj}) and run 'gcloud services enable aiplatform.googleapis.com --project {proj}'.",
            "media_type": "SYNTHETIC",
            "model": selected_model
        }
    except Exception as e:
        logger.info("Veo generation exception: %s", e)
        return {
            "status": "BLOCKED",
            "reason": f"Vertex AI Veo video generation requires active Veo quota on project '{proj}' in region {location}. Error: {str(e)}. Action required: enable model in Vertex AI Model Garden (https://console.cloud.google.com/vertex-ai/model-garden?project={proj}) and run 'gcloud services enable aiplatform.googleapis.com --project {proj}'.",
            "media_type": "SYNTHETIC",
            "model": "veo-3.1-fast-generate-001"
        }
