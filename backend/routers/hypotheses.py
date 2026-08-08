from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from agents.mcp_client import generate_hypothesis

router = APIRouter()

@router.post("/projects/{project_id}/experiments/{experiment_id}/generate-hypothesis")
async def create_hypothesis(project_id: str, experiment_id: str):
    try:
        hypothesis_data = await generate_hypothesis(project_id, experiment_id)
        
        return {
            "status": "success",
            "hypothesis": hypothesis_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
