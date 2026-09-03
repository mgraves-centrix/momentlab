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

print("Fetching real ClickHouse query IDs for canonical seed...")
real_q_ids = []
try:
    from backend.services.clickhouse import get_client
    ch_c = get_client()
    q_res = ch_c.query("SELECT query_id FROM system.query_log WHERE type = 'QueryFinish' AND (query LIKE '%momentlab%' OR query LIKE '%audience_events%' OR query LIKE '%screening_sessions%') AND query NOT LIKE '%system.query_log%' ORDER BY query_start_time DESC LIMIT 10")
    if q_res and q_res.result_rows:
        real_q_ids = [r[0] for r in q_res.result_rows if r and r[0]]
    if not real_q_ids:
        ch_c.query("SELECT count() FROM momentlab.audience_events WHERE project_id = 'proj_northlight_01' AND experiment_id = 'exp_23a'")
        ch_c.query("SELECT count() FROM momentlab.reaction_events WHERE project_id = 'proj_northlight_01' AND experiment_id = 'exp_23a'")
        q_res = ch_c.query("SELECT query_id FROM system.query_log WHERE type = 'QueryFinish' AND (query LIKE '%momentlab%' OR query LIKE '%audience_events%') AND query NOT LIKE '%system.query_log%' ORDER BY query_start_time DESC LIMIT 10")
        if q_res and q_res.result_rows:
            real_q_ids = [r[0] for r in q_res.result_rows if r and r[0]]
except Exception as e:
    print(f"Warning: could not fetch query_log for seed: {e}")

print("Seeding canonical hypothesis for exp_23a...")
hyp_data = {
    "id": "hyp_northlight_01",
    "project_id": "proj_northlight_01",
    "experiment_id": "exp_23a",
    "proposedChange": "Move reveal 6s earlier",
    "observation": "Sharp -34.2% retention drop (vs 00:00–00:10 baseline) at 00:37 in Scene 12 across 18-24 cohort.",
    "rationale": "Audience retention drops significantly at 00:37 during the extended pause in Scene 12. Cutting 6 seconds accelerates pacing without sacrificing plot clarity.",
    "confidenceScore": 92,
    "forecastEngagement": "+18%",
    "forecastCompletion": "+9%",
    "forecastConfusion": "-4%",
    "status": "PROPOSED",
    "isSimulated": True,
    "evidenceIds": ["EV-01", "EV-02", "EV-03"],
    "evidenceRecords": [
        {
            "id": "EV-01",
            "timestamp": "00:37",
            "metric": "Response cliff",
            "segment": "ALL",
            "window": "00:33–00:41",
            "effectSize": "-28%",
            "significance": "p < 0.001",
            "sourceQueryRunId": real_q_ids[0] if len(real_q_ids) > 0 else None
        },
        {
            "id": "EV-02",
            "timestamp": "00:35",
            "metric": "Confusion spike",
            "segment": "18–24",
            "window": "00:31–00:39",
            "effectSize": "+35%",
            "significance": "p < 0.01",
            "sourceQueryRunId": real_q_ids[1] if len(real_q_ids) > 1 else (real_q_ids[0] if real_q_ids else None)
        },
        {
            "id": "EV-03",
            "timestamp": "00:40",
            "metric": "Boredom exit",
            "segment": "25–34",
            "window": "00:36–00:44",
            "effectSize": "-20%",
            "significance": "p < 0.05",
            "sourceQueryRunId": real_q_ids[2] if len(real_q_ids) > 2 else (real_q_ids[0] if real_q_ids else None)
        }
    ],
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


print("Computing & persisting anomaly detector from ClickHouse...")
try:
    from backend.services.detector import compute_and_persist_detector
    compute_and_persist_detector("proj_northlight_01", "exp_23a")
except Exception as e:
    print(f"Warning: could not compute detector during seed: {e}")

print("Firestore seeding complete.")
