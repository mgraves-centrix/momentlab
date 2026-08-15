import os
from dotenv import load_dotenv
from google.cloud import firestore

load_dotenv()
if "FIRESTORE_EMULATOR_HOST" not in os.environ:
    os.environ["FIRESTORE_EMULATOR_HOST"] = "localhost:8080"

_firestore_client = None

def get_db():
    """Initializes and returns the Firestore client supporting local emulator and cloud."""
    global _firestore_client
    if _firestore_client is None:
        project_id = os.getenv("GCP_PROJECT_ID", os.getenv("GOOGLE_CLOUD_PROJECT", "guarded-ops"))
        _firestore_client = firestore.Client(project=project_id)
    return _firestore_client


