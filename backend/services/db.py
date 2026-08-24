import os
from dotenv import load_dotenv
from google.cloud import firestore
from backend.services.gcp_config import get_gcp_project_id

load_dotenv()
if os.getenv("FIRESTORE_EMULATOR_HOST") == "":
    os.environ.pop("FIRESTORE_EMULATOR_HOST", None)

_firestore_client = None

def get_db():
    """Initializes and returns the Firestore client supporting local emulator and cloud."""
    global _firestore_client
    if _firestore_client is None:
        if os.getenv("FIRESTORE_EMULATOR_HOST") == "":
            os.environ.pop("FIRESTORE_EMULATOR_HOST", None)
        project_id = get_gcp_project_id()
        _firestore_client = firestore.Client(project=project_id)
    return _firestore_client


