import os
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/projects", tags=["Projects & Scenes"])

class SceneMetadata(BaseModel):
    id: str
    name: str
    timecode_start: str = "00:00"
    timecode_end: str = "01:30"
    video_url: str
    poster_url: Optional[str] = None
    created_at: str = "2026-08-04T01:30:00Z"

class ProjectRecord(BaseModel):
    id: str
    name: str
    description: str
    sceneCount: int = 1
    totalRespondents: int = 4732
    status: str = "ACTIVE"
    lastActivity: str = "2026-08-04T01:30:00Z"
    scenes: List[SceneMetadata] = []

class CreateProjectRequest(BaseModel):
    name: str
    description: str

class CreateSceneRequest(BaseModel):
    name: str
    video_url: str = "/scene12.mp4"
    poster_url: Optional[str] = "/scene12.png"

# In-memory store initialized with Northlight default project
PROJECTS_DB: Dict[str, ProjectRecord] = {
    "proj_northlight_01": ProjectRecord(
        id="proj_northlight_01",
        name="Northlight",
        description="Feature psychological thriller — Scene 12 edit optimization",
        sceneCount=4,
        totalRespondents=4732,
        status="ACTIVE",
        lastActivity="2026-08-04T01:30:00Z",
        scenes=[
            SceneMetadata(
                id="sc_12",
                name="Scene 12 INT. APARTMENT - NIGHT",
                timecode_start="00:00",
                timecode_end="01:00",
                video_url="/scene12.mp4",
                poster_url="/scene12.png"
            )
        ]
    )
}

@router.get("", response_model=List[ProjectRecord])
def list_projects():
    """Lists all active film workspace projects."""
    return list(PROJECTS_DB.values())

@router.post("", response_model=ProjectRecord, status_code=status.HTTP_201_CREATED)
def create_project(req: CreateProjectRequest):
    """Creates a new workspace project."""
    project_id = f"proj_{uuid.uuid4().hex[:8]}"
    project = ProjectRecord(
        id=project_id,
        name=req.name,
        description=req.description,
        sceneCount=0,
        totalRespondents=0,
        status="ACTIVE"
    )
    PROJECTS_DB[project_id] = project
    return project

@router.get("/{project_id}", response_model=ProjectRecord)
def get_project(project_id: str):
    """Retrieves project details by ID."""
    if project_id not in PROJECTS_DB:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
    return PROJECTS_DB[project_id]

@router.post("/{project_id}/scenes", response_model=SceneMetadata, status_code=status.HTTP_201_CREATED)
def add_scene_to_project(project_id: str, req: CreateSceneRequest):
    """Adds a scene cut to an existing project."""
    if project_id not in PROJECTS_DB:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
    
    scene_id = f"sc_{uuid.uuid4().hex[:6]}"
    scene = SceneMetadata(
        id=scene_id,
        name=req.name,
        video_url=req.video_url,
        poster_url=req.poster_url
    )
    PROJECTS_DB[project_id].scenes.append(scene)
    PROJECTS_DB[project_id].sceneCount += 1
    return scene
