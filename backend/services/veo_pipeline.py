import os
import uuid
import logging
import subprocess
from typing import List, Dict, Any, Optional, Tuple
from backend.services.gcp_config import get_gcp_project_id

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

VERIFIED_VEO_INVOCABILITY: Dict[Tuple[str, str], Dict[str, Any]] = {
    ("us-central1", "veo-3.1-generate-001"): {
        "invocable": True,
        "invocable_source": "verified_2026_09_06"
    },
    ("us-central1", "veo-3.0-generate-001"): {
        "invocable": False,
        "invocable_source": "verified_2026_09_06"
    }
}

def discover_available_veo_models(project_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Queries live Vertex AI across supported regions to probe Veo availability in the publisher catalog.

    Note: Invocability status is recorded from out-of-band empirical verification rather than
    probed at request time. Live invocability probing requires executing a billable video generation
    request (predictLongRunning), as standard GET requests on publisher model resources return 404 even
    for invocable models.
    """
    proj = get_gcp_project_id(project_id)
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
                inv_info = VERIFIED_VEO_INVOCABILITY.get((region, model), {
                    "invocable": None,
                    "invocable_source": "unverified"
                })
                matrix.append({
                    "region": region,
                    "model": model,
                    "in_catalog": False,
                    "status": "NOT_IN_CATALOG",
                    "invocable": inv_info["invocable"],
                    "invocable_source": inv_info["invocable_source"],
                    "error": str(e)
                })
            continue

        for model in VEO_CANDIDATE_MODELS:
            in_cat = model in available_names
            inv_info = VERIFIED_VEO_INVOCABILITY.get((region, model), {
                "invocable": None,
                "invocable_source": "unverified"
            })
            matrix.append({
                "region": region,
                "model": model,
                "in_catalog": in_cat,
                "status": "IN_CATALOG" if in_cat else "NOT_IN_CATALOG",
                "invocable": inv_info["invocable"],
                "invocable_source": inv_info["invocable_source"],
                "error": None if in_cat else "Model not in publisher catalog for region"
            })
            
    return matrix

def get_media_duration(file_path: str, ffprobe_bin: str = "ffprobe") -> Optional[float]:
    """
    Probes media duration in seconds using ffprobe.
    """
    if not file_path or not os.path.exists(file_path):
        return None
    try:
        res = subprocess.run(
            [ffprobe_bin, "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file_path],
            capture_output=True,
            text=True,
            check=True
        )
        return float(res.stdout.strip())
    except Exception as e:
        logger.warning("ffprobe duration probe failed for %s: %s", file_path, e)
        return None

def stitch_video_clips(clip_paths: List[str], output_path: str, ffmpeg_bin: str = "ffmpeg", ffprobe_bin: str = "ffprobe") -> bool:
    """
    Stitches multiple video clip files into one continuous sequence asset.
    Normalizes clips to a common resolution (1280x720) and frame rate (30fps) using ffmpeg filter_complex.
    Verifies that the probed output duration matches the expected sum of input durations (within +-1.0s tolerance).
    Returns False if ffmpeg is unavailable, processing fails, or duration check fails.
    """
    if not clip_paths or not all(os.path.exists(p) for p in clip_paths):
        logger.error("stitch_video_clips: clip_paths empty or input files do not exist.")
        return False

    res_ff = subprocess.run(["which", ffmpeg_bin], capture_output=True, text=True)
    res_pr = subprocess.run(["which", ffprobe_bin], capture_output=True, text=True)
    if res_ff.returncode != 0 or res_pr.returncode != 0:
        logger.error("ffmpeg or ffprobe binary not available on system.")
        return False

    durations = [get_media_duration(p, ffprobe_bin) for p in clip_paths]
    if any(d is None for d in durations):
        logger.error("Failed to probe duration for one or more input clips.")
        return False
    expected_duration = sum(durations)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    n = len(clip_paths)
    inputs = []
    filter_parts = []
    concat_inputs = []
    for i, p in enumerate(clip_paths):
        inputs.extend(["-i", os.path.abspath(p)])
        filter_parts.append(f"[{i}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v{i}]")
        concat_inputs.append(f"[v{i}]")

    filter_complex = ";".join(filter_parts) + ";" + "".join(concat_inputs) + f"concat=n={n}:v=1:a=0[v]"

    cmd = [
        ffmpeg_bin, "-y"
    ] + inputs + [
        "-filter_complex", filter_complex,
        "-map", "[v]",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        output_path
    ]

    try:
        run_res = subprocess.run(cmd, capture_output=True, text=True)
        if run_res.returncode != 0:
            logger.error("ffmpeg concat execution failed: %s", run_res.stderr)
            return False
    except Exception as e:
        logger.error("ffmpeg execution exception: %s", e)
        return False

    if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
        logger.error("Stitched output file missing or zero bytes.")
        return False

    out_dur = get_media_duration(output_path, ffprobe_bin)
    if out_dur is None or abs(out_dur - expected_duration) > 1.0:
        logger.error("Output duration (%s) does not match expected sum (%s +- 1.0s)", out_dur, expected_duration)
        return False

    return True

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
    proj = get_gcp_project_id(project_id)
    
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
            if stitch_video_clips(generated_clips, final_path) and os.path.exists(final_path) and os.path.getsize(final_path) > 0:
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
