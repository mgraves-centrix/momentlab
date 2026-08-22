import os
from backend.services.veo_pipeline import stitch_video_clips, discover_available_veo_models

def test_stitch_video_clips_creates_valid_asset(tmp_path):
    public_dir = os.path.join(os.path.dirname(__file__), "..", "..", "public")
    in1 = os.path.join(public_dir, "sample_flower.mp4")
    in2 = os.path.join(public_dir, "scene12.mp4")
    
    out = os.path.join(tmp_path, "stitched_output.mp4")
    success = stitch_video_clips([in1, in2], out)
    assert success is True
    assert os.path.exists(out)
    assert os.path.getsize(out) > 0

def test_discover_veo_models_returns_matrix():
    matrix = discover_available_veo_models("guarded-ops")
    assert isinstance(matrix, list)
    assert len(matrix) >= 1
    assert any(m["region"] == "us-central1" for m in matrix)
