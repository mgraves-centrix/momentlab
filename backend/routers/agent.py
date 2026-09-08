import logging
from typing import List, Dict, Any
from datetime import timezone
from fastapi import APIRouter, HTTPException, status

logger = logging.getLogger("momentlab.agent_router")

router = APIRouter()

@router.get("/runs")
async def get_recent_agent_runs() -> List[Dict[str, Any]]:
    """
    Returns the most recent agent runs recorded in momentlab.agent_runs ledger.
    Public read endpoint.
    """
    try:
        from backend.services.clickhouse import get_client
        client = get_client()
        sql = """
            SELECT run_id, started_at, project_id, experiment_id, model, decision, grounded,
                   duration_ms, mcp_query_count, data_query_count, primary_query, primary_rows,
                   primary_ms
            FROM momentlab.agent_runs
            ORDER BY started_at DESC
            LIMIT 10
        """
        result = client.query(sql)
        rows = getattr(result, "result_rows", []) or []

        runs = []
        for row in rows:
            raw_dt = row[1]
            if hasattr(raw_dt, "isoformat"):
                if getattr(raw_dt, "tzinfo", None) is None:
                    raw_dt = raw_dt.replace(tzinfo=timezone.utc)
                st_str = raw_dt.isoformat()
            else:
                st_str = str(raw_dt) if raw_dt is not None else ""

            runs.append({
                "run_id": str(row[0] or ""),
                "started_at": st_str,
                "project_id": str(row[2] or ""),
                "experiment_id": str(row[3] or ""),
                "model": str(row[4] or ""),
                "decision": str(row[5] or ""),
                "grounded": int(row[6] or 0),
                "duration_ms": int(row[7] or 0),
                "mcp_query_count": int(row[8] or 0),
                "data_query_count": int(row[9] or 0),
                "primary_query": str(row[10] or ""),
                "primary_rows": int(row[11] or 0),
                "primary_ms": int(row[12] or 0),
            })
        return runs
    except Exception as e:
        logger.error("Error fetching agent runs from ledger: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Agent runs ledger unavailable"
        )
