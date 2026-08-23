import logging
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from backend.agents.mcp_client import generate_hypothesis
from backend.services.db import get_db

logger = logging.getLogger("momentlab.hypotheses")

router = APIRouter()

class RevisionRequest(BaseModel):
    notes: Optional[str] = "Review confounders and tighten cut window"

@router.get("/projects/{project_id}/experiments/{experiment_id}/hypothesis")
async def get_hypothesis(project_id: str, experiment_id: str):
    db = get_db()
    doc_ref = db.collection('projects').document(project_id).collection('experiments').document(experiment_id).collection('hypotheses').document('current')
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Hypothesis not found")
        
    return {
        "status": "success",
        "hypothesis": doc.to_dict()
    }

@router.post("/projects/{project_id}/experiments/{experiment_id}/generate-hypothesis")
async def create_hypothesis(project_id: str, experiment_id: str):
    try:
        hypothesis_data = await generate_hypothesis(project_id, experiment_id)
        
        # Save to Firestore
        db = get_db()
        doc_ref = db.collection('projects').document(project_id).collection('experiments').document(experiment_id).collection('hypotheses').document('current')
        doc_ref.set(hypothesis_data)
        
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
async def request_hypothesis_revision(project_id: str, experiment_id: str, req: Optional[RevisionRequest] = None):
    db = get_db()
    doc_ref = db.collection('projects').document(project_id).collection('experiments').document(experiment_id).collection('hypotheses').document('current')
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Hypothesis not found")
    
    data = doc.to_dict()
    data['status'] = 'REVISION_REQUESTED'
    data['revision_notes'] = req.notes if req else "Tighten cut window"
    doc_ref.set(data)
    
    return {
        "status": "success",
        "message": "Revision requested",
        "hypothesis": data
    }

@router.post("/projects/{project_id}/experiments/{experiment_id}/hypothesis/discard")
async def discard_hypothesis(project_id: str, experiment_id: str):
    db = get_db()
    doc_ref = db.collection('projects').document(project_id).collection('experiments').document(experiment_id).collection('hypotheses').document('current')
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
async def approve_test(project_id: str, experiment_id: str):
    db = get_db()
    doc_ref = db.collection('projects').document(project_id).collection('experiments').document(experiment_id).collection('hypotheses').document('current')
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Hypothesis not found")
        
    data = doc.to_dict()
    if data.get('status') not in ['PROPOSED', 'APPROVED', 'REVISION_REQUESTED']:
        raise HTTPException(status_code=400, detail="Hypothesis is not in an actionable state")
        
    data['status'] = 'APPROVED'
    doc_ref.set(data)
    
    return data
