from pydantic import BaseModel, Field, UUID4
from typing import Optional, Literal
from datetime import datetime, timezone

class ConsentRecord(BaseModel):
    session_id: str
    screening_token: str
    project_id: str = "proj_northlight_01"
    experiment_id: str = "exp_23a"
    scene_id: str = "sc_12"
    respondent_cohort: Literal["18_24", "25_34", "35_44", "45_plus"] = "18_24"
    consent_given: bool
    consent_timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PlaybackEvent(BaseModel):
    session_id: str
    project_id: str = "proj_northlight_01"
    experiment_id: str = "exp_23a"
    scene_id: str = "sc_12"
    media_time_ms: int = Field(ge=0, description="Canonical media timecode position in milliseconds")
    retention_score: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    playback_state: Literal["PLAYING", "PAUSED", "SEEKING"] = "PLAYING"
    idempotency_key: str

CANONICAL_REACTION_TYPES = ("CONFUSED", "ENGAGING", "BORED", "ENGAGED", "FUNNY", "TOO SLOW")
ReactionType = Literal["CONFUSED", "ENGAGING", "BORED", "ENGAGED", "FUNNY", "TOO SLOW"]

class ReactionEvent(BaseModel):
    session_id: str
    project_id: str = "proj_northlight_01"
    experiment_id: str = "exp_23a"
    scene_id: str = "sc_12"
    media_time_ms: int = Field(ge=0)
    reaction_type: ReactionType
    value: Optional[float] = None
    idempotency_key: Optional[str] = None

class IngestionResponse(BaseModel):
    status: Literal["SUCCESS", "QUEUED", "DUPLICATE", "REJECTED_NO_CONSENT"]
    inserted_count: int
    idempotency_key: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
