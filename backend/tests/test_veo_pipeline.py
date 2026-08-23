import os
from backend.services.veo_pipeline import (
    stitch_video_clips,
    discover_available_veo_models,
    get_media_duration
)

def test_stitch_video_clips_creates_valid_asset_matching_input_duration(tmp_path):
    public_dir = os.path.join(os.path.dirname(__file__), "..", "..", "public")
    in1 = os.path.join(public_dir, "sample_flower.mp4")
    in2 = os.path.join(public_dir, "scene12.mp4")
    
    dur1 = get_media_duration(in1)
    dur2 = get_media_duration(in2)
    assert dur1 is not None and dur1 > 0
    assert dur2 is not None and dur2 > 0
    expected_duration = dur1 + dur2

    out = os.path.join(tmp_path, "stitched_output.mp4")
    success = stitch_video_clips([in1, in2], out)
    assert success is True
    assert os.path.exists(out)
    assert os.path.getsize(out) > 0

    out_dur = get_media_duration(out)
    assert out_dur is not None
    assert abs(out_dur - expected_duration) <= 1.0

def test_stitch_video_clips_fails_safely_when_ffmpeg_unavailable(tmp_path):
    public_dir = os.path.join(os.path.dirname(__file__), "..", "..", "public")
    in1 = os.path.join(public_dir, "sample_flower.mp4")
    in2 = os.path.join(public_dir, "scene12.mp4")
    
    out = os.path.join(tmp_path, "stitched_fail.mp4")
    success = stitch_video_clips([in1, in2], out, ffmpeg_bin="nonexistent_ffmpeg")
    assert success is False

def test_stitch_video_clips_fails_on_missing_input_file(tmp_path):
    out = os.path.join(tmp_path, "stitched_missing.mp4")
    success = stitch_video_clips(["/tmp/nonexistent_clip.mp4"], out)
    assert success is False

def test_discover_veo_models_returns_matrix():
    matrix = discover_available_veo_models("momentlab-504305")
    assert isinstance(matrix, list)
    assert len(matrix) >= 1
    assert any(m["region"] == "us-central1" for m in matrix)
