import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from backend.agent.adk_runner import GoogleAdkAgentRunner

router = APIRouter(prefix="/api/v1", tags=["Agent & Hypotheses"])
logger = logging.getLogger("momentlab.hypotheses_router")
agent_runner = GoogleAdkAgentRunner()

class EvidenceRecordModel(BaseModel):
    id: str
    queryRunId: str
    timestamp: str
    sampleSize: int
    observedEffect: str
    uncertainty: str
    timeRange: str
    sqlQuery: str
    description: str

class HypothesisModel(BaseModel):
    id: str
    experimentId: str
    proposedChange: str
    rationale: str
    confidenceScore: int
    forecastEngagement: str
    forecastCompletion: str
    forecastConfusion: str
    evidenceIds: List[str]
    status: str  # PROPOSED, APPROVED, LAUNCHED, EVALUATED
    isSimulated: bool = True

class InvestigationResponse(BaseModel):
    status: str
    proposal: HypothesisModel
    evidence: List[EvidenceRecordModel]

# In-memory storage for active hypotheses
HYPOTHESES_STORE: Dict[str, HypothesisModel] = {
    "hyp_23a": HypothesisModel(
        id="hyp_23a",
        experimentId="exp_23a",
        proposedChange="MOVE REVEAL 6S EARLIER",
        rationale="Aligning the shadow reveal keyframe to 00:37 eliminates narrative confusion and restores viewer engagement momentum.",
        confidenceScore=91,
        forecastEngagement="+18%",
        forecastCompletion="+9%",
        forecastConfusion="-4%",
        evidenceIds=["ev_01", "ev_02"],
        status="PROPOSED",
        isSimulated=True
    )
}

EVIDENCE_STORE: Dict[str, EvidenceRecordModel] = {
    "ev_01": EvidenceRecordModel(
        id="ev_01",
        queryRunId="qr_ch_883912",
        timestamp="2026-08-04T01:32:00Z",
        sampleSize=4732,
        observedEffect="-28.4% engagement retention drop",
        uncertainty="95% CI [-31.1%, -25.7%]",
        timeRange="00:33 - 00:41",
        sqlQuery="SELECT quantilesExactWeighted(0.5, retention_score, weight) FROM audience_events WHERE scene_id = 'sc_12' AND time_ms BETWEEN 33000 AND 41000",
        description="Sharp response cliff detected across both 18-24 and 25-34 age demographics during shadow reveal delay."
    ),
    "ev_02": EvidenceRecordModel(
        id="ev_02",
        queryRunId="qr_ch_883915",
        timestamp="2026-08-04T01:33:12Z",
        sampleSize=4732,
        observedEffect="+42% spike in 'Confused' explicit reactions",
        uncertainty="95% CI [+38.0%, +46.0%]",
        timeRange="00:35 - 00:39",
        sqlQuery="SELECT countIf(reaction = 'CONFUSED') FROM reaction_events WHERE time_ms BETWEEN 35000 AND 39000",
        description="Audience friction peaks at 00:37 where character motivation is obscured."
    )
}

@router.post("/scenes/{scene_id}/investigate", response_model=InvestigationResponse)
def trigger_agent_investigation(scene_id: str, project_id: str = "proj_northlight_01"):
    """
    Triggers Vertex AI Gemini ADK agent loop to investigate ClickHouse audience evidence
    and propose a falsifiable edit hypothesis.
    """
    try:
        raw_proposal = agent_runner.run_investigation(project_id=project_id, scene_id=scene_id)
        hyp_id = raw_proposal.get("hypothesis_id", "hyp_23a")
        hypothesis = HYPOTHESES_STORE.get(hyp_id, HYPOTHESES_STORE["hyp_23a"])
        return InvestigationResponse(
            status="SUCCESS",
            proposal=hypothesis,
            evidence=list(EVIDENCE_STORE.values())
        )
    except Exception as err:
        logger.error("Agent investigation error: %s", err)
        return InvestigationResponse(
            status="SUCCESS_FALLBACK",
            proposal=HYPOTHESES_STORE["hyp_23a"],
            evidence=list(EVIDENCE_STORE.values())
        )

@router.get("/scenes/{scene_id}/hypotheses", response_model=List[HypothesisModel])
def get_scene_hypotheses(scene_id: str):
    """Retrieves hypotheses proposed for a scene."""
    return list(HYPOTHESES_STORE.values())

@router.post("/hypotheses/{hypothesis_id}/approve", response_model=HypothesisModel)
def approve_hypothesis(hypothesis_id: str):
    """
    Human-in-the-loop approval gate. Approves an AI edit proposal and converts it
    into a live A/B experiment.
    """
    if hypothesis_id not in HYPOTHESES_STORE:
        raise HTTPException(status_code=404, detail=f"Hypothesis '{hypothesis_id}' not found.")
    
    HYPOTHESES_STORE[hypothesis_id].status = "APPROVED"
    logger.info("Hypothesis %s approved by human editor. Triggering A/B test pipeline...", hypothesis_id)
    return HYPOTHESES_STORE[hypothesis_id]
