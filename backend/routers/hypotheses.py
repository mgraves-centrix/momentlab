from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
# pyrefly: ignore [missing-import]
from backend.agents.mcp_client import generate_hypothesis
from backend.services.db import get_db

router = APIRouter()

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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/projects/{project_id}/experiments/{experiment_id}/test/approve")
async def approve_test(project_id: str, experiment_id: str):
    db = get_db()
    doc_ref = db.collection('projects').document(project_id).collection('experiments').document(experiment_id).collection('hypotheses').document('current')
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Hypothesis not found")
        
    data = doc.to_dict()
    if data.get('status') not in ['PROPOSED', 'APPROVED']:
        raise HTTPException(status_code=400, detail="Hypothesis is not in a proposed state")
        
    data['status'] = 'APPROVED'
    doc_ref.set(data)
    
    return data
