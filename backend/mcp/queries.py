# Predefined Read-Only ClickHouse Query Templates for Gemini ADK Agent

RETENTION_SERIES_QUERY = """
SELECT 
    media_time_ms,
    round(avgMerge(retention_avg), 2) AS avg_retention,
    round(quantileMerge(0.9)(retention_p90), 2) AS uncertainty_upper,
    round(quantileMerge(0.1)(retention_p10), 2) AS uncertainty_lower,
    sum(sample_size) AS sample_size
FROM momentlab.retention_by_second_aggregated
WHERE project_id = {project_id:String} 
  AND scene_id = {scene_id:String}
GROUP BY media_time_ms
ORDER BY media_time_ms ASC
LIMIT 100
"""

ANOMALY_CLIFF_QUERY = """
SELECT 
    media_time_ms,
    avgMerge(retention_avg) AS retention,
    lagInFrame(avgMerge(retention_avg), 1) OVER (ORDER BY media_time_ms) AS prev_retention,
    (avgMerge(retention_avg) - lagInFrame(avgMerge(retention_avg), 1) OVER (ORDER BY media_time_ms)) AS retention_delta
FROM momentlab.retention_by_second_aggregated
WHERE project_id = {project_id:String} AND scene_id = {scene_id:String}
GROUP BY media_time_ms
ORDER BY retention_delta ASC
LIMIT 1
"""

REACTION_BREAKDOWN_QUERY = """
SELECT 
    media_time_ms,
    sum(confused_count) AS confused_count,
    sum(engaging_count) AS engaging_count,
    sum(bored_count) AS bored_count
FROM momentlab.reaction_anomalies_aggregated
WHERE project_id = {project_id:String} 
  AND scene_id = {scene_id:String}
  AND media_time_ms BETWEEN {start_ms:UInt32} AND {end_ms:UInt32}
GROUP BY media_time_ms
ORDER BY media_time_ms ASC
"""
