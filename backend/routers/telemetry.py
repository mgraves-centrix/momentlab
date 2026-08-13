from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel
from datetime import datetime
router = APIRouter()



@router.get("/timeline")
async def get_timeline(project_id: str, experiment_id: str):
    try:
        from backend.services.clickhouse import get_client
        client = get_client()
        query = f"""
            SELECT 
                toFloat32(toInt32(media_time_ms / 1000) * 1000) AS time_bucket,
                count() as total_events,
                avg(retention_score) as avg_value
            FROM momentlab.audience_events
            WHERE project_id = '{project_id}' AND experiment_id = '{experiment_id}'
            GROUP BY time_bucket
            ORDER BY time_bucket
        """
        result = client.query(query)
        timeline = []
        for row in result.result_rows:
            timeline.append({
                "media_time_ms": int(row[0]),
                "total_events": row[1],
                "avg_value": row[2]
            })
        return timeline
    except Exception as e:
        # If table missing or db down, return empty
        return []

@router.get("/queries")
async def get_recent_queries():
    try:
        from backend.services.clickhouse import get_client
        client = get_client()
        query = """
            SELECT 
                query_start_time,
                query,
                read_rows,
                query_duration_ms
            FROM system.query_log
            WHERE user = 'momentlab_mcp_reader' 
              AND type = 'QueryFinish'
              AND query LIKE '%SELECT%'
            ORDER BY query_start_time DESC
            LIMIT 10
        """
        result = client.query(query)
        queries = []
        for row in result.result_rows:
            queries.append({
                "timestamp": row[0].isoformat() if hasattr(row[0], 'isoformat') else str(row[0]),
                "query": row[1],
                "rows": row[2],
                "duration_ms": row[3]
            })
        return queries
    except Exception as e:
        print(f"Error fetching query log: {e}")
        return []

@router.get("/summary")
async def get_summary(project_id: str, experiment_id: str):
    try:
        from backend.services.clickhouse import get_client
        client = get_client()
        
        # 1. Total distinct respondents
        query_respondents = f"""
            SELECT count(DISTINCT session_id) 
            FROM momentlab.audience_events 
            WHERE project_id = '{project_id}' AND experiment_id = '{experiment_id}'
        """
        res = client.query(query_respondents)
        total_respondents = res.result_rows[0][0] if res.result_rows else 0
        
        return {
            "total_respondents": total_respondents
        }
    except Exception as e:
        print(f"Error fetching summary: {e}")
        return {"total_respondents": 0}
