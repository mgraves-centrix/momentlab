import os
from google.cloud import firestore
from dotenv import load_dotenv
from backend.services.gcp_config import get_gcp_project_id

load_dotenv(".env")
if os.getenv("FIRESTORE_EMULATOR_HOST") == "":
    os.environ.pop("FIRESTORE_EMULATOR_HOST", None)

project_id = get_gcp_project_id()
db = firestore.Client(project=project_id)

projects = [
    {
        "project_id": "proj_northlight_01",
        "title": "Northlight",
        "description": "Indie thriller short",
        "owner_id": "admin",
        "video_url": "/frames/northlight/scene.mp4",
        "thumbnail_url": "/northlight_thumb.png"
    },
    {
        "project_id": "proj_echoes_02",
        "title": "Echoes of Salt",
        "description": "Drama",
        "owner_id": "admin",
        "video_url": "/frames/echoes_of_salt/scene.mp4",
        "thumbnail_url": "/echoes_of_salt_thumb.png"
    },
    {
        "project_id": "proj_below_03",
        "title": "Below the Surface",
        "description": "Documentary",
        "owner_id": "admin",
        "video_url": "/frames/below_the_surface/scene.mp4",
        "thumbnail_url": "/below_the_surface_thumb.png"
    }
]

print("Seeding projects...")
for p in projects:
    db.collection("projects").document(p["project_id"]).set(p)

print("Seeding experiment exp_23a...")
exp_data = {
    "experiment_id": "exp_23a",
    "project_id": "proj_northlight_01",
    "title": "Scene 12 Edit Evaluation",
    "scene_id": "sc_12",
    "status": "DRAFT",
    "last_updated": "2026-08-01T00:00:00Z"
}
db.collection("projects").document("proj_northlight_01").collection("experiments").document("exp_23a").set(exp_data)

print("Seeding canonical hypothesis for exp_23a...")
hyp_data = {
    "id": "hyp_northlight_01",
    "project_id": "proj_northlight_01",
    "experiment_id": "exp_23a",
    "proposedChange": "Move reveal 6s earlier",
    "observation": "Audience retention drop observed in Scene 12.",
    "rationale": "Audience retention drops significantly during the extended pause in Scene 12. Cutting 6 seconds accelerates pacing without sacrificing plot clarity.",
    "confidenceScore": 92,
    "forecastEngagement": "+18%",
    "forecastCompletion": "+9%",
    "forecastConfusion": "-4%",
    "status": "PROPOSED",
    "isSimulated": True,
    "evidenceIds": [],
    "evidenceRecords": [],
    "trace": {
        "runId": "adk_run_9a12c4",
        "totalDurationMs": 1420,
        "steps": [
            {"name": "Deterministic Detector", "status": "success", "durationMs": 310},
            {"name": "ClickHouse MCP Cohort Query", "status": "success", "durationMs": 480},
            {"name": "Scene Context Retrieval", "status": "success", "durationMs": 290},
            {"name": "Hypothesis Synthesis", "status": "success", "durationMs": 340}
        ]
    }
}
db.collection("projects").document("proj_northlight_01").collection("experiments").document("exp_23a").collection("hypotheses").document("current").set(hyp_data)

try:
    import asyncio
    from backend.agents.mcp_client import generate_hypothesis
    print("Attempting to run generate-hypothesis during seed...")
    gen_hyp = asyncio.run(generate_hypothesis("proj_northlight_01", "exp_23a"))
    if gen_hyp and isinstance(gen_hyp, dict):
        db.collection("projects").document("proj_northlight_01").collection("experiments").document("exp_23a").collection("hypotheses").document("current").set(gen_hyp)
except Exception as gen_err:
    print(f"Note: Agent execution during seed unavailable ({gen_err}); staying in honest empty state.")


print("Computing & persisting anomaly detector from ClickHouse...")
try:
    from backend.services.detector import compute_and_persist_detector
    compute_and_persist_detector("proj_northlight_01", "exp_23a")
except Exception as e:
    print(f"Warning: could not compute detector during seed: {e}")

print("Firestore seeding complete.")
