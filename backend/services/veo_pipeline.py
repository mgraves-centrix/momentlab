import os
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
