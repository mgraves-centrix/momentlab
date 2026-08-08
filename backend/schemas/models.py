from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, timezone

class User(BaseModel):
    user_id: str
    email: str
    roles: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Project(BaseModel):
    project_id: str
    title: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    owner_id: str
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None

class Experiment(BaseModel):
    experiment_id: str
    project_id: str
    title: str
    status: str = "DRAFT" # DRAFT, COLLECTING, READY_FOR_ANALYSIS, INVESTIGATING, HYPOTHESIS_READY, AWAITING_APPROVAL, TEST_RUNNING, SUPPORTED, REJECTED, INCONCLUSIVE
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    hypothesis: Optional[Dict] = None

class ConsentAudit(BaseModel):
    audit_id: str
    experiment_id: str
    reviewer_id: str
    action: str = "APPROVED"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ip_address: Optional[str] = None
