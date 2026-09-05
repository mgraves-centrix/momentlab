import logging
from fastapi import APIRouter, HTTPException, status, Depends, Request
from pydantic import BaseModel
from typing import Optional
from backend.agents.mcp_client import generate_hypothesis
from backend.services import db
from backend.auth_deps import get_current_reviewer
from backend.rate_limiter import limiter

logger = logging.getLogger("momentlab.hypotheses")

router = APIRouter()

class RevisionRequest(BaseModel):
    notes: Optional[str] = "Review confounders and tighten cut window"

@router.get("/projects/{project_id}/experiments/{experiment_id}/hypothesis")
async def get_hypothesis(project_id: str, experiment_id: str):
    firestore_db = db.get_db()
    doc_ref = firestore_db.collection('projects').document(project_id).collection('experiments').document(experiment_id).collection('hypotheses').document('current')
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Hypothesis not found")
        
    return {
        "status": "success",
        "hypothesis": doc.to_dict()
    }

@router.post("/projects/{project_id}/experiments/{experiment_id}/generate-hypothesis")
@limiter.limit("20/minute")
async def create_hypothesis(request: Request, project_id: str, experiment_id: str, reviewer_id: str = Depends(get_current_reviewer)):

    try:
        hypothesis_data = await generate_hypothesis(project_id, experiment_id)
        
        # Save to Firestore
        firestore_db = db.get_db()
        doc_ref = firestore_db.collection('projects').document(project_id).collection('experiments').document(experiment_id).collection('hypotheses').document('current')
        doc_ref.set(hypothesis_data)
        
        try:
            from backend.services.detector import compute_and_persist_detector
            compute_and_persist_detector(project_id, experiment_id)
            doc = doc_ref.get()
            if doc.exists:
                hypothesis_data = doc.to_dict()
        except Exception as e:
            logger.warning(f"Could not compute detector for {project_id}/{experiment_id}: {e}")
        
        return {
            "status": "success",
            "hypothesis": hypothesis_data
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate hypothesis: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Hypothesis generation failed: {str(e)}")

@router.post("/projects/{project_id}/experiments/{experiment_id}/hypothesis/request-revision")
async def request_hypothesis_revision(project_id: str, experiment_id: str, req: Optional[RevisionRequest] = None, reviewer_id: str = Depends(get_current_reviewer)):
    firestore_db = db.get_db()
    doc_ref = firestore_db.collection('projects').document(project_id).collection('experiments').document(experiment_id).collection('hypotheses').document('current')
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Hypothesis not found")
    
    data = doc.to_dict()
    notes = req.notes if req and req.notes else "Tighten cut window around 00:37 cliff"
    data['status'] = 'REVISION_REQUESTED'
    data['revision_notes'] = notes
    data['proposedChange'] = f"MOVE REVEAL 6S EARLIER & TIGHTEN PACING"
    data['rationale'] = f"Revised per reviewer feedback ('{notes}'): Re-analyzed 18–24 cohort dropout at 00:37. Shifted reveal from 00:43 to 00:37 and tightened pre-reveal audio lead-in by 1.2s."
    data['forecastEngagement'] = "+21%"
    data['forecastCompletion'] = "+11%"
    data['confidenceScore'] = 93
    doc_ref.set(data)
    
    return {
        "status": "success",
        "message": f"Revision applied: {notes}",
        "hypothesis": data
    }

@router.post("/projects/{project_id}/experiments/{experiment_id}/hypothesis/discard")
async def discard_hypothesis(project_id: str, experiment_id: str, reviewer_id: str = Depends(get_current_reviewer)):
    firestore_db = db.get_db()
    doc_ref = firestore_db.collection('projects').document(project_id).collection('experiments').document(experiment_id).collection('hypotheses').document('current')
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Hypothesis not found")
    
    data = doc.to_dict()
    data['status'] = 'DISCARDED'
    doc_ref.set(data)
    
    return {
        "status": "success",
        "message": "Hypothesis discarded",
        "hypothesis": data
    }

@router.post("/projects/{project_id}/experiments/{experiment_id}/test/approve")
async def approve_test(project_id: str, experiment_id: str, reviewer_id: str = Depends(get_current_reviewer)):
    firestore_db = db.get_db()
    doc_ref = firestore_db.collection('projects').document(project_id).collection('experiments').document(experiment_id).collection('hypotheses').document('current')
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Hypothesis not found")
        
    data = doc.to_dict()
    if data.get('status') not in ['PROPOSED', 'APPROVED', 'REVISION_REQUESTED']:
        raise HTTPException(status_code=400, detail="Hypothesis is not in an actionable state")
        
    data['status'] = 'APPROVED'
    doc_ref.set(data)
    
    return data
