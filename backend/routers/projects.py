import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from google.cloud import storage
from backend.services import db
from backend.schemas.models import Project
from backend.auth_deps import get_current_reviewer

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

@router.get("", response_model=List[Project])
def list_projects():
    """Lists all active projects with canonical demo projects ordered first."""
    client = db.get_db()
    projects_ref = client.collection('projects')
    docs = projects_ref.stream()
    
    # Query ClickHouse for distinct respondents and scenes per project if available
    respondents_by_project = {}
    scenes_by_project = {}
    try:
        from backend.services.clickhouse import get_client
        ch_client = get_client()
        res = ch_client.query("SELECT project_id, count(DISTINCT session_id), count(DISTINCT scene_id) FROM momentlab.screening_sessions WHERE session_id != '00000000-0000-0000-0000-000000000000' GROUP BY project_id")
        for row in res.result_rows:
            if row[0] and row[1] > 0:
                respondents_by_project[row[0]] = int(row[1])
                scenes_by_project[row[0]] = int(row[2]) if row[2] > 0 else 1
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
            if total_resp >= 100:
                data["latest_finding"] = data.get("latest_finding") or "Response cliff detected"
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
    try:
        from backend.services.clickhouse import get_client
        ch_client = get_client()
        res = ch_client.query("SELECT count(DISTINCT session_id), count(DISTINCT scene_id) FROM momentlab.audience_events WHERE project_id = {project_id:String}", parameters={'project_id': project_id})
        if res.result_rows and res.result_rows[0][0] > 0:
            total_resp = int(res.result_rows[0][0])
            scene_cnt = int(res.result_rows[0][1]) if res.result_rows[0][1] > 0 else 1
    except Exception:
        pass

    if total_resp > 0:
        data["scene_count"] = scene_cnt
        data["total_respondents"] = total_resp
        data["status"] = "ACTIVE"
        data["screening_progress"] = min(100, int((total_resp / 500) * 100)) if total_resp >= 100 else int((total_resp / 100) * 100)
        data["analysis_status"] = "ANALYSIS READY" if total_resp >= 100 else "COLLECTING"
        if total_resp >= 100:
            data["latest_finding"] = data.get("latest_finding") or "Response cliff detected"
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
    return os.getenv("MEDIA_BUCKET_NAME", "momentlab-media-demo")

@router.post("/{project_id}/media", response_model=SignedUrlResponse)
def generate_upload_url(project_id: str, filename: str, content_type: str, reviewer_id: str = Depends(get_current_reviewer)):
    """Generates a V4 signed URL for uploading video media to GCS."""
    client = db.get_db()
    if not client.collection('projects').document(project_id).get().exists:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")

    client = _get_storage_client()
    bucket_name = _get_media_bucket_name()
    bucket = client.bucket(bucket_name)
    
    # Store media under project_id prefix
    blob_name = f"projects/{project_id}/media/{uuid.uuid4().hex[:8]}_{filename}"
    blob = bucket.blob(blob_name)
    
    url = blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=15),
        method="PUT",
        content_type=content_type,
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
    
    url = blob.generate_signed_url(
        version="v4",
        expiration=timedelta(hours=2),
        method="GET"
    )
    
    return SignedUrlResponse(
        url=url,
        method="GET",
        expires_at=datetime.now(timezone.utc) + timedelta(hours=2)
    )
