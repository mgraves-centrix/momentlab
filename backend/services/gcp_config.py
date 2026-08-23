import os
from typing import Optional
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

DEFAULT_GCP_PROJECT_ID = "momentlab-504305"
DEFAULT_GCP_LOCATION = "us-central1"


def get_gcp_project_id(project_id: Optional[str] = None) -> str:
    """
    Resolves the GCP project ID with the following precedence:
    1. Explicitly passed project_id
    2. GCP_PROJECT_ID environment variable
    3. GOOGLE_CLOUD_PROJECT environment variable
    4. Default project ID ('momentlab-504305')
    """
    if project_id:
        return project_id
    return os.getenv("GCP_PROJECT_ID", os.getenv("GOOGLE_CLOUD_PROJECT", DEFAULT_GCP_PROJECT_ID))


def get_gcp_location(location: Optional[str] = None) -> str:
    """
    Resolves the GCP region/location.
    """
    if location:
        return location
    return os.getenv("GCP_LOCATION", DEFAULT_GCP_LOCATION)
