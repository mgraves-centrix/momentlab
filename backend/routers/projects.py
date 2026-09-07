import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from google.cloud import storage
import google.auth
import google.auth.transport.requests
from backend.services import db
from backend.schemas.models import Project
from backend.auth_deps import get_current_reviewer

logger = logging.getLogger("momentlab.routers.projects")

router = APIRouter(prefix="/api/v1/projects", tags=["Projects"])

class CreateProjectRequest(BaseModel):
    title: str
    description: Optional[str] = None
    owner_id: str

class SignedUrlResponse(BaseModel):
    url: str
    method: str
    expires_at: datetime

PROJECT_MEDIA = {
    "proj_northlight_01": {
        "video_url": "/frames/northlight/scene.mp4",
        "thumbnail_url": "/northlight_thumb.png",
    },
    "proj_echoes_02": {
        "video_url": "/frames/echoes_of_salt/scene.mp4",
        "thumbnail_url": "/echoes_of_salt_thumb.png",
    },
    "proj_below_03": {
        "video_url": "/frames/below_the_surface/scene.mp4",
        "thumbnail_url": "/below_the_surface_thumb.png",
    }
}

DEFAULT_EXPERIMENTS = {
    "proj_northlight_01": "exp_23a",
    "proj_echoes_02": "exp_01b",
    "proj_below_03": "exp_01c",
}

def derive_latest_finding(project_id: str, total_resp: int, persisted_finding: Optional[str] = None) -> Optional[str]:
    """Reads the persisted latest_finding from the project document."""
    if not total_resp or total_resp < 100:
        return None
    try:
        if persisted_finding is not None:
            return persisted_finding
        client = db.get_db()
        doc = client.collection('projects').document(project_id).get()
        if doc.exists:
            return doc.to_dict().get("latest_finding")
        return None
    except Exception as e:
        logger.error("Failed to read latest_finding for project %s: %s", project_id, e)
        return None

@router.get("", response_model=List[Project])
def list_projects():
    """Lists all active projects with canonical demo projects ordered first."""
    client = db.get_db()
    projects_ref = client.collection('projects')
    docs = projects_ref.stream()
    
    # Query ClickHouse for distinct respondents, scenes, and experiment_id per project if available
    respondents_by_project = {}
    scenes_by_project = {}
    experiments_by_project = {}
    try:
        from backend.services.clickhouse import get_client
        ch_client = get_client()
        res = ch_client.query("SELECT project_id, count(DISTINCT session_id), count(DISTINCT scene_id), any(experiment_id) FROM momentlab.screening_sessions WHERE session_id != '00000000-0000-0000-0000-000000000000' GROUP BY project_id")
        for row in res.result_rows:
            if row[0] and row[1] > 0:
                respondents_by_project[row[0]] = int(row[1])
                scenes_by_project[row[0]] = int(row[2]) if row[2] > 0 else 1
                if len(row) >= 4 and row[3]:
                    experiments_by_project[row[0]] = str(row[3])
    except Exception:
        pass

    projects = []
    for doc in docs:
        data = doc.to_dict()
        pid = data.get("project_id")
        
        # Populate live experiment stats from actual ClickHouse telemetry
        if pid in respondents_by_project and respondents_by_project[pid] > 0:
            total_resp = respondents_by_project[pid]
            data["scene_count"] = scenes_by_project.get(pid, 1)
            data["total_respondents"] = total_resp
            data["status"] = "ACTIVE"
            data["screening_progress"] = min(100, int((total_resp / 500) * 100)) if total_resp >= 100 else int((total_resp / 100) * 100)
            data["analysis_status"] = "ANALYSIS READY" if total_resp >= 100 else "COLLECTING"
            data["latest_finding"] = derive_latest_finding(pid, total_resp, data.get("latest_finding"))
        else:
            # Honest empty state for projects with no screening data
            data["scene_count"] = None
            data["total_respondents"] = None
            data["status"] = "DRAFT"
            data["latest_finding"] = None
            data["screening_progress"] = None
            data["analysis_status"] = None

        # Wire canonical media per project
        if pid in PROJECT_MEDIA:
            data["video_url"] = data.get("video_url") or PROJECT_MEDIA[pid]["video_url"]
            data["thumbnail_url"] = data.get("thumbnail_url") or PROJECT_MEDIA[pid]["thumbnail_url"]

        projects.append(Project(**data))
        
    # Canonical demo priority ordering: Northlight (1), Echoes (2), Below (3)
    priority = {"proj_northlight_01": 0, "proj_echoes_02": 1, "proj_below_03": 2}
    projects.sort(key=lambda p: priority.get(p.project_id, 99))
    return projects

@router.post("", response_model=Project, status_code=status.HTTP_201_CREATED)
def create_project(req: CreateProjectRequest, reviewer_id: str = Depends(get_current_reviewer)):
    """Creates a new workspace project."""
    client = db.get_db()
    project_id = f"proj_{uuid.uuid4().hex[:8]}"
    
    project = Project(
        project_id=project_id,
        title=req.title,
        description=req.description,
        owner_id=req.owner_id
    )
    
    client.collection('projects').document(project_id).set(project.model_dump(mode='json'))
    return project

@router.get("/{project_id}", response_model=Project)
def get_project(project_id: str):
    """Retrieves project details by ID."""
    client = db.get_db()
    doc_ref = client.collection('projects').document(project_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
        
    data = doc.to_dict()
    total_resp = 0
    scene_cnt = 0
    exp_id = None
    try:
        from backend.services.clickhouse import get_client
        ch_client = get_client()
        res = ch_client.query("SELECT count(DISTINCT session_id), count(DISTINCT scene_id), any(experiment_id) FROM momentlab.audience_events WHERE project_id = {project_id:String}", parameters={'project_id': project_id})
        if res.result_rows and res.result_rows[0][0] > 0:
            total_resp = int(res.result_rows[0][0])
            scene_cnt = int(res.result_rows[0][1]) if res.result_rows[0][1] > 0 else 1
            if len(res.result_rows[0]) >= 3 and res.result_rows[0][2]:
                exp_id = str(res.result_rows[0][2])
    except Exception:
        pass

    if total_resp > 0:
        data["scene_count"] = scene_cnt
        data["total_respondents"] = total_resp
        data["status"] = "ACTIVE"
        data["screening_progress"] = min(100, int((total_resp / 500) * 100)) if total_resp >= 100 else int((total_resp / 100) * 100)
        data["analysis_status"] = "ANALYSIS READY" if total_resp >= 100 else "COLLECTING"
        data["latest_finding"] = derive_latest_finding(project_id, total_resp, data.get("latest_finding"))
    else:
        data["scene_count"] = None
        data["total_respondents"] = None
        data["status"] = "DRAFT"
        data["latest_finding"] = None
        data["screening_progress"] = None
        data["analysis_status"] = None
        
    if project_id in PROJECT_MEDIA:
        data["video_url"] = data.get("video_url") or PROJECT_MEDIA[project_id]["video_url"]
        data["thumbnail_url"] = data.get("thumbnail_url") or PROJECT_MEDIA[project_id]["thumbnail_url"]

    return Project(**data)

@router.delete("/{project_id}", status_code=status.HTTP_200_OK)
def delete_project(project_id: str, reviewer_id: str = Depends(get_current_reviewer)):
    """Deletes a workspace project."""
    client = db.get_db()
    doc_ref = client.collection('projects').document(project_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
    
    if project_id in ["proj_northlight_01", "proj_echoes_02", "proj_below_03"]:
        raise HTTPException(status_code=400, detail="Cannot delete core demo projects.")
        
    doc_ref.delete()
    return {"status": "DELETED", "project_id": project_id}

def _get_storage_client():
    return storage.Client()

def _get_media_bucket_name():
    # Target bucket for user project media uploads (momentlab-media-demo)
    return os.getenv("MEDIA_BUCKET_NAME", "momentlab-media-demo")

def _get_asset_bucket_name():
    # Media asset bucket for scene video sources and rendered variant cuts (momentlab-504305-media)
    return os.getenv("ASSET_BUCKET_NAME", "momentlab-504305-media")

@router.post("/{project_id}/media", response_model=SignedUrlResponse)
def generate_upload_url(project_id: str, filename: str, content_type: str, reviewer_id: str = Depends(get_current_reviewer)):
    """Generates a V4 signed URL for uploading video media to GCS."""
    client = db.get_db()
    if not client.collection('projects').document(project_id).get().exists:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")

    client = _get_storage_client()
    # Uploads target the upload bucket (momentlab-media-demo)
    bucket_name = _get_media_bucket_name()
    bucket = client.bucket(bucket_name)
    
    # Store media under project_id prefix
    blob_name = f"projects/{project_id}/media/{uuid.uuid4().hex[:8]}_{filename}"
    blob = bucket.blob(blob_name)
    
    try:
        credentials, _ = google.auth.default()
        if not credentials.valid:
            credentials.refresh(google.auth.transport.requests.Request())
        
        sa_email = getattr(credentials, "service_account_email", None)
        if not sa_email or sa_email == "default":
            sa_email = os.getenv("SERVICE_ACCOUNT_EMAIL", "15885136313-compute@developer.gserviceaccount.com")
            
        access_token = getattr(credentials, "token", None)
        
        url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=15),
            method="PUT",
            content_type=content_type,
            service_account_email=sa_email,
            access_token=access_token,
        )
    except Exception as e:
        logger.error("Failed to generate IAM-signed upload URL for blob %s: %s", blob_name, e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate signed upload URL: {str(e)}"
        )
    
    return SignedUrlResponse(
        url=url,
        method="PUT",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15)
    )

@router.get("/{project_id}/media", response_model=SignedUrlResponse)
def generate_download_url(project_id: str, blob_name: str):
    """Generates a short-lived V4 signed URL for playing media from GCS."""
    client = db.get_db()
    if not client.collection('projects').document(project_id).get().exists:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
        
    client = _get_storage_client()
    bucket = client.bucket(_get_media_bucket_name())
    blob = bucket.blob(blob_name)
    
    try:
        credentials, _ = google.auth.default()
        if not credentials.valid:
            credentials.refresh(google.auth.transport.requests.Request())
        
        sa_email = getattr(credentials, "service_account_email", None)
        if not sa_email or sa_email == "default":
            sa_email = os.getenv("SERVICE_ACCOUNT_EMAIL", "15885136313-compute@developer.gserviceaccount.com")
            
        access_token = getattr(credentials, "token", None)
        
        url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(hours=2),
            method="GET",
            service_account_email=sa_email,
            access_token=access_token,
        )
    except Exception as e:
        logger.error("Failed to generate IAM-signed download URL for blob %s: %s", blob_name, e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate signed download URL: {str(e)}"
        )
    
    return SignedUrlResponse(
        url=url,
        method="GET",
        expires_at=datetime.now(timezone.utc) + timedelta(hours=2)
    )
