import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from google.cloud import storage
from backend.services.db import get_db
from backend.schemas.models import Project

router = APIRouter(prefix="/api/v1/projects", tags=["Projects"])

class CreateProjectRequest(BaseModel):
    title: str
    description: Optional[str] = None
    owner_id: str

class SignedUrlResponse(BaseModel):
    url: str
    method: str
    expires_at: datetime

@router.get("", response_model=List[Project])
def list_projects():
    """Lists all active projects."""
    db = get_db()
    projects_ref = db.collection('projects')
    docs = projects_ref.stream()
    
    projects = []
    for doc in docs:
        data = doc.to_dict()
        projects.append(Project(**data))
        
    return projects

@router.post("", response_model=Project, status_code=status.HTTP_201_CREATED)
def create_project(req: CreateProjectRequest):
    """Creates a new workspace project."""
    db = get_db()
    project_id = f"proj_{uuid.uuid4().hex[:8]}"
    
    project = Project(
        project_id=project_id,
        title=req.title,
        description=req.description,
        owner_id=req.owner_id
    )
    
    db.collection('projects').document(project_id).set(project.model_dump(mode='json'))
    return project

@router.get("/{project_id}", response_model=Project)
def get_project(project_id: str):
    """Retrieves project details by ID."""
    db = get_db()
    doc_ref = db.collection('projects').document(project_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
        
    return Project(**doc.to_dict())

def _get_storage_client():
    return storage.Client()

def _get_media_bucket_name():
    return os.getenv("MEDIA_BUCKET_NAME", "momentlab-media-demo")

@router.post("/{project_id}/media", response_model=SignedUrlResponse)
def generate_upload_url(project_id: str, filename: str, content_type: str):
    """Generates a V4 signed URL for uploading video media to GCS."""
    db = get_db()
    if not db.collection('projects').document(project_id).get().exists:
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
    db = get_db()
    if not db.collection('projects').document(project_id).get().exists:
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
