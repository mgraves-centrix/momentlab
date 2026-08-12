import os
from google.cloud import firestore
from dotenv import load_dotenv

# Ensure we use the emulator
load_dotenv(".env")
os.environ["FIRESTORE_EMULATOR_HOST"] = "localhost:8080"

# Note: In an emulator environment, the project ID can be arbitrary, 
# but it should match whatever your app uses, usually the default "demo-project" or GCP_PROJECT_ID
project_id = os.getenv("GCP_PROJECT_ID", "guarded-ops")
db = firestore.Client(project=project_id)

projects = [
    {
        "project_id": "proj_northlight_01",
        "title": "Northlight",
        "description": "Indie thriller short",
        "owner_id": "admin"
    },
    {
        "project_id": "proj_echoes_02",
        "title": "Echoes of Salt",
        "description": "Drama",
        "owner_id": "admin"
    },
    {
        "project_id": "proj_below_03",
        "title": "Below the Surface",
        "description": "Documentary",
        "owner_id": "admin"
    }
]

print("Seeding projects...")
for p in projects:
    db.collection("projects").document(p["project_id"]).set(p)

print("Seeding experiment exp_23a...")
exp_data = {
    "status": "DRAFT",
    "last_updated": "2026-08-01T00:00:00Z"
}
db.collection("projects").document("proj_northlight_01").collection("experiments").document("exp_23a").set(exp_data)

print("Firestore seeding complete.")
