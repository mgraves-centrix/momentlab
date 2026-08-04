# Predefined Read-Only ClickHouse Query Templates for Gemini ADK Agent

RETENTION_SERIES_QUERY = """
SELECT 
    media_time_ms,
    round(avg(retention_score), 2) AS avg_retention,
    round(quantileExact(0.95)(retention_score), 2) AS uncertainty_upper,
    round(quantileExact(0.05)(retention_score), 2) AS uncertainty_lower,
    count() AS sample_size
FROM momentlab.audience_events
WHERE project_id = {project_id:String} 
  AND scene_id = {scene_id:String}
GROUP BY media_time_ms
ORDER BY media_time_ms ASC
LIMIT 100
"""

ANOMALY_CLIFF_QUERY = """
SELECT 
    media_time_ms,
    avg(retention_score) AS retention,
    lagInFrame(avg(retention_score), 1) OVER (ORDER BY media_time_ms) AS prev_retention,
    (avg(retention_score) - lagInFrame(avg(retention_score), 1) OVER (ORDER BY media_time_ms)) AS retention_delta
FROM momentlab.audience_events
WHERE project_id = {project_id:String} AND scene_id = {scene_id:String}
GROUP BY media_time_ms
ORDER BY retention_delta ASC
LIMIT 1
"""

REACTION_BREAKDOWN_QUERY = """
SELECT 
    media_time_ms,
    reaction_type,
    count() AS reaction_count
FROM momentlab.reaction_events
WHERE project_id = {project_id:String} 
  AND scene_id = {scene_id:String}
  AND media_time_ms BETWEEN {start_ms:UInt32} AND {end_ms:UInt32}
GROUP BY media_time_ms, reaction_type
ORDER BY media_time_ms ASC
"""
