#!/usr/bin/env python3
"""
MomentLab Scene Video Assembly Pipeline
Generates distinct full-length cinematic scene videos (>=61s, >=1280x720) per project
using Ken Burns pans/zooms and crossfades between high-resolution stills.
Uses pure ffmpeg and Python standard library.
"""

import os
import shutil
import subprocess

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PUBLIC_DIR = os.path.join(BASE_DIR, "public")
BRAIN_DIR = "/Users/mattgraves/.gemini/antigravity-ide/brain/12f68d71-7a98-4847-b166-0d9108006ccc"

def probe_duration(file_path: str) -> float:
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        file_path
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return float(res.stdout.strip())

def probe_dimensions(file_path: str):
    cmd = [
        "ffprobe", "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height",
        "-of", "default=noprint_wrappers=1",
        file_path
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    lines = res.stdout.strip().split("\n")
    w = int([l.split("=")[1] for l in lines if l.startswith("width=")][0])
    h = int([l.split("=")[1] for l in lines if l.startswith("height=")][0])
    return w, h

def convert_crop_image(src_path: str, dst_path: str, crop_w: float, crop_h: float, x_offset: float, y_offset: float, target_w: int = 1376, target_h: int = 768):
    """
    Uses ffmpeg to crop and scale an image to target resolution.
    """
    vf = f"crop=iw*{crop_w}:ih*{crop_h}:iw*{x_offset}:ih*{y_offset},scale={target_w}:{target_h}:flags=lanczos"
    cmd = [
        "ffmpeg", "-y",
        "-i", src_path,
        "-vf", vf,
        dst_path
    ]
    subprocess.run(cmd, capture_output=True, text=True, check=True)

def render_shot_clip(
    image_path: str,
    output_path: str,
    duration: float = 12.0,
    zoom_type: str = "zoom_in",
    target_w: int = 1376,
    target_h: int = 768,
    fps: int = 30
):
    """
    Renders an individual shot with smooth Ken Burns motion (pan/zoom).
    """
    frames_count = int(duration * fps)
    
    if zoom_type == "zoom_in":
        # Slow zoom in from 1.0 to 1.12
        vf = (
            f"zoompan=z='min(zoom+0.0005,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
            f"d={frames_count}:s={target_w}x{target_h}:fps={fps},"
            f"format=yuv420p"
        )
    elif zoom_type == "zoom_out":
        # Slow zoom out from 1.12 to 1.0
        vf = (
            f"zoompan=z='if(lte(zoom,1.0),1.12,max(1.001,zoom-0.0005))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
            f"d={frames_count}:s={target_w}x{target_h}:fps={fps},"
            f"format=yuv420p"
        )
    elif zoom_type == "pan_right":
        # Slow pan right
        vf = (
            f"zoompan=z=1.08:x='if(lte(on,1),(iw-iw/zoom)/2,min(x+0.5,iw-iw/zoom))':y='ih/2-(ih/zoom/2)':"
            f"d={frames_count}:s={target_w}x{target_h}:fps={fps},"
            f"format=yuv420p"
        )
    else:  # pan_left
        vf = (
            f"zoompan=z=1.08:x='if(lte(on,1),iw-iw/zoom,max(x-0.5,0))':y='ih/2-(ih/zoom/2)':"
            f"d={frames_count}:s={target_w}x{target_h}:fps={fps},"
            f"format=yuv420p"
        )

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1",
        "-i", image_path,
        "-vf", vf,
        "-t", str(duration),
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        output_path
    ]
    subprocess.run(cmd, capture_output=True, text=True, check=True)

def render_scene_video(shot_clips, output_mp4, target_duration=65.0):
    """
    Stitches shot clips with 1.0s crossfades between consecutive shots.
    """
    n = len(shot_clips)
    inputs = []
    for c in shot_clips:
        inputs.extend(["-i", c])
    
    # Crossfade duration
    trans_dur = 1.0
    
    # Durations of individual clips
    durations = [probe_duration(c) for c in shot_clips]
    
    filter_parts = []
    last_v = "[0:v]"
    current_offset = durations[0] - trans_dur
    
    for i in range(1, n):
        next_v = f"[{i}:v]"
        out_v = f"[v{i}]" if i < n - 1 else "[vfinal]"
        filter_parts.append(f"{last_v}{next_v}xfade=transition=fade:duration={trans_dur}:offset={current_offset:.2f}{out_v}")
        last_v = out_v
        if i < n - 1:
            current_offset += (durations[i] - trans_dur)
            
    filter_complex = ";".join(filter_parts)
    
    cmd = [
        "ffmpeg", "-y"
    ] + inputs + [
        "-filter_complex", filter_complex,
        "-map", "[vfinal]",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "19",
        "-pix_fmt", "yuv420p",
        output_mp4
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("FFmpeg error:", res.stderr)
        raise RuntimeError(f"FFmpeg concat failed: {res.stderr}")

def prepare_northlight():
    print("--- Preparing Northlight ---")
    out_dir = os.path.join(PUBLIC_DIR, "frames", "northlight")
    os.makedirs(out_dir, exist_ok=True)
    
    # 6 source stills
    stills = [
        (os.path.join(BRAIN_DIR, "northlight_establishing_1787539044004.jpg"), "frame_01_establishing.jpg", 13.0, "zoom_in"),
        (os.path.join(BRAIN_DIR, "northlight_tension_1787539076667.jpg"), "frame_02_tension.jpg", 12.0, "pan_right"),
        (os.path.join(BRAIN_DIR, "northlight_investigation_1787539088640.jpg"), "frame_03_investigation.jpg", 12.0, "zoom_out"),
        (os.path.join(BRAIN_DIR, "northlight_drag_1787539099520.jpg"), "frame_04_drag.jpg", 12.0, "pan_left"),       # Covers 00:33-00:41 drag
        (os.path.join(BRAIN_DIR, "northlight_reveal_1787539110915.jpg"), "frame_05_reveal.jpg", 12.0, "zoom_in"),      # Reveal at 00:43
        (os.path.join(BRAIN_DIR, "northlight_reaction_1787539122917.jpg"), "frame_06_reaction.jpg", 9.0, "zoom_out"),
    ]
    
    shot_clips = []
    tmp_dir = os.path.join(out_dir, "tmp_shots")
    os.makedirs(tmp_dir, exist_ok=True)
    
    for src, name, dur, motion in stills:
        dst = os.path.join(out_dir, name)
        shutil.copyfile(src, dst)
        clip_path = os.path.join(tmp_dir, f"clip_{name}.mp4")
        print(f"Rendering shot {name} ({dur}s, {motion})...")
        render_shot_clip(dst, clip_path, duration=dur, zoom_type=motion)
        shot_clips.append(clip_path)
        
    scene_mp4 = os.path.join(out_dir, "scene.mp4")
    print("Stitching Northlight scene video...")
    render_scene_video(shot_clips, scene_mp4)
    
    # Create poster image (1376x768)
    poster_png = os.path.join(out_dir, "poster.png")
    shutil.copyfile(os.path.join(out_dir, "frame_01_establishing.jpg"), poster_png)
    shutil.copyfile(poster_png, os.path.join(PUBLIC_DIR, "northlight_thumb.png"))
    
    # Clean up tmp shots
    shutil.rmtree(tmp_dir, ignore_errors=True)
    
    dur = probe_duration(scene_mp4)
    w, h = probe_dimensions(scene_mp4)
    print(f"Northlight scene video complete: duration={dur:.2f}s, dimensions={w}x{h}")
    assert dur >= 61.0, f"Duration {dur} < 61.0s"
    assert w >= 1280 and h >= 720, f"Resolution {w}x{h} < 1280x720"

def prepare_echoes_of_salt():
    print("--- Preparing Echoes of Salt ---")
    out_dir = os.path.join(PUBLIC_DIR, "frames", "echoes_of_salt")
    os.makedirs(out_dir, exist_ok=True)
    
    stills = [
        (os.path.join(BRAIN_DIR, "echoes_coast_1787539135860.jpg"), "frame_01_coast.jpg", 13.0, "pan_right"),
        (os.path.join(BRAIN_DIR, "echoes_lighthouse_1787539150073.jpg"), "frame_02_lighthouse.jpg", 12.0, "zoom_in"),
        (os.path.join(BRAIN_DIR, "echoes_pier_1787539161821.jpg"), "frame_03_pier.jpg", 12.0, "zoom_out"),
        (os.path.join(BRAIN_DIR, "echoes_cottage_1787539173936.jpg"), "frame_04_cottage.jpg", 12.0, "zoom_in"),
        (os.path.join(BRAIN_DIR, "echoes_skiff_1787539185779.jpg"), "frame_05_skiff.jpg", 12.0, "pan_left"),
        (os.path.join(BRAIN_DIR, "echoes_dusk_1787539198957.jpg"), "frame_06_dusk.jpg", 9.0, "zoom_in"),
    ]
    
    shot_clips = []
    tmp_dir = os.path.join(out_dir, "tmp_shots")
    os.makedirs(tmp_dir, exist_ok=True)
    
    for src, name, dur, motion in stills:
        dst = os.path.join(out_dir, name)
        shutil.copyfile(src, dst)
        clip_path = os.path.join(tmp_dir, f"clip_{name}.mp4")
        print(f"Rendering shot {name} ({dur}s, {motion})...")
        render_shot_clip(dst, clip_path, duration=dur, zoom_type=motion)
        shot_clips.append(clip_path)
        
    scene_mp4 = os.path.join(out_dir, "scene.mp4")
    print("Stitching Echoes of Salt scene video...")
    render_scene_video(shot_clips, scene_mp4)
    
    poster_png = os.path.join(out_dir, "poster.png")
    shutil.copyfile(os.path.join(out_dir, "frame_02_lighthouse.jpg"), poster_png)
    shutil.copyfile(poster_png, os.path.join(PUBLIC_DIR, "echoes_of_salt_thumb.png"))
    
    shutil.rmtree(tmp_dir, ignore_errors=True)
    
    dur = probe_duration(scene_mp4)
    w, h = probe_dimensions(scene_mp4)
    print(f"Echoes of Salt scene video complete: duration={dur:.2f}s, dimensions={w}x{h}")
    assert dur >= 61.0, f"Duration {dur} < 61.0s"
    assert w >= 1280 and h >= 720, f"Resolution {w}x{h} < 1280x720"

def prepare_below_the_surface():
    print("--- Preparing Below the Surface ---")
    out_dir = os.path.join(PUBLIC_DIR, "frames", "below_the_surface")
    os.makedirs(out_dir, exist_ok=True)
    
    vessel_src = os.path.join(BRAIN_DIR, "below_vessel_1787539211864.jpg")
    sub_src = os.path.join(PUBLIC_DIR, "below_the_surface_thumb.png")
    
    # Frame 1: Vessel wide
    convert_crop_image(vessel_src, os.path.join(out_dir, "frame_01_vessel.jpg"), 1.0, 1.0, 0.0, 0.0)
    # Frame 2: Vessel deck crop
    convert_crop_image(vessel_src, os.path.join(out_dir, "frame_02_deck.jpg"), 0.6, 0.5, 0.25, 0.25)
    # Frame 3: Ocean horizon
    convert_crop_image(vessel_src, os.path.join(out_dir, "frame_03_bridge.jpg"), 0.7, 0.5, 0.1, 0.35)
    # Frame 4: Submersible deep exploration
    convert_crop_image(sub_src, os.path.join(out_dir, "frame_04_depths.jpg"), 1.0, 0.7, 0.0, 0.15)
    # Frame 5: Close up on robotic sampling arm
    convert_crop_image(sub_src, os.path.join(out_dir, "frame_05_sampling.jpg"), 0.7, 0.5, 0.2, 0.25)
    # Frame 6: Benthic sonar survey
    convert_crop_image(sub_src, os.path.join(out_dir, "frame_06_survey.jpg"), 0.7, 0.55, 0.1, 0.3)
    
    stills = [
        (os.path.join(out_dir, "frame_01_vessel.jpg"), "frame_01_vessel.jpg", 13.0, "zoom_in"),
        (os.path.join(out_dir, "frame_02_deck.jpg"), "frame_02_deck.jpg", 12.0, "pan_right"),
        (os.path.join(out_dir, "frame_03_bridge.jpg"), "frame_03_bridge.jpg", 12.0, "zoom_out"),
        (os.path.join(out_dir, "frame_04_depths.jpg"), "frame_04_depths.jpg", 12.0, "zoom_in"),
        (os.path.join(out_dir, "frame_05_sampling.jpg"), "frame_05_sampling.jpg", 12.0, "pan_left"),
        (os.path.join(out_dir, "frame_06_survey.jpg"), "frame_06_survey.jpg", 9.0, "zoom_out"),
    ]
    
    shot_clips = []
    tmp_dir = os.path.join(out_dir, "tmp_shots")
    os.makedirs(tmp_dir, exist_ok=True)
    
    for src, name, dur, motion in stills:
        clip_path = os.path.join(tmp_dir, f"clip_{name}.mp4")
        print(f"Rendering shot {name} ({dur}s, {motion})...")
        render_shot_clip(src, clip_path, duration=dur, zoom_type=motion)
        shot_clips.append(clip_path)
        
    scene_mp4 = os.path.join(out_dir, "scene.mp4")
    print("Stitching Below the Surface scene video...")
    render_scene_video(shot_clips, scene_mp4)
    
    poster_png = os.path.join(out_dir, "poster.png")
    shutil.copyfile(os.path.join(out_dir, "frame_01_vessel.jpg"), poster_png)
    shutil.copyfile(poster_png, os.path.join(PUBLIC_DIR, "below_the_surface_thumb.png"))
    
    shutil.rmtree(tmp_dir, ignore_errors=True)
    
    dur = probe_duration(scene_mp4)
    w, h = probe_dimensions(scene_mp4)
    print(f"Below the Surface scene video complete: duration={dur:.2f}s, dimensions={w}x{h}")
    assert dur >= 61.0, f"Duration {dur} < 61.0s"
    assert w >= 1280 and h >= 720, f"Resolution {w}x{h} < 1280x720"

if __name__ == "__main__":
    prepare_northlight()
    prepare_echoes_of_salt()
    prepare_below_the_surface()
    print("All scene videos assembled and verified successfully!")
