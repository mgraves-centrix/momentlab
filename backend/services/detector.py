import logging
from typing import Optional, Dict, Any
from backend.services.clickhouse import get_client
from backend.services.db import get_db

logger = logging.getLogger("momentlab.services.detector")

def run_anomaly_detector(project_id: str, experiment_id: str) -> Dict[str, Any]:
    """Computes anomaly metrics server-side from ClickHouse audience_events."""
    try:
        client = get_client()
        
        query_respondents = """
            SELECT count(DISTINCT session_id) 
            FROM momentlab.audience_events 
            WHERE project_id = {project_id:String} AND experiment_id = {experiment_id:String}
        """
        res = client.query(query_respondents, parameters={'project_id': project_id, 'experiment_id': experiment_id})
        total_respondents = int(res.result_rows[0][0]) if (res.result_rows and res.result_rows[0][0] > 0) else 0

        if total_respondents < 100:
            return {
                "sampleSize": total_respondents,
                "detectedMoment": None,
                "detectedMomentMs": None,
                "retentionDrop": None,
                "anomalyWindow": None,
            }

        q_timeline = """
            SELECT toFloat32(toInt32(media_time_ms / 1000) * 1000) as time_bucket, avg(retention_score) as avg_val
            FROM momentlab.audience_events
            WHERE project_id = {project_id:String} AND experiment_id = {experiment_id:String}
            GROUP BY time_bucket
            ORDER BY time_bucket
        """
        t_res = client.query(q_timeline, parameters={'project_id': project_id, 'experiment_id': experiment_id})
        
        detected_moment = None
        detected_moment_ms = None
        retention_drop = None
        anomaly_window = None

        if t_res.result_rows and len(t_res.result_rows) >= 5:
            pts = [(int(r[0]), float(r[1])) for r in t_res.result_rows]
            baseline = sum(p[1] for p in pts[:min(10, len(pts))]) / min(10, len(pts))
            min_pt = min(pts, key=lambda p: p[1])
            drop_val = baseline - min_pt[1]
            if drop_val >= 15.0:
                cliff_ms = min_pt[0]
                start_ms = max(0, cliff_ms - 4000)
                end_ms = cliff_ms + 4000
                detected_moment_ms = cliff_ms
                s_sec = cliff_ms // 1000
                detected_moment = f"{s_sec // 60:02d}:{s_sec % 60:02d}"
                retention_drop = f"-{round(drop_val, 1)}%"
                st_sec, en_sec = start_ms // 1000, end_ms // 1000
                anomaly_window = f"{st_sec // 60:02d}:{st_sec % 60:02d}–{en_sec // 60:02d}:{en_sec % 60:02d}"

        return {
            "sampleSize": total_respondents,
            "detectedMoment": detected_moment,
            "detectedMomentMs": detected_moment_ms,
            "retentionDrop": retention_drop,
            "anomalyWindow": anomaly_window,
        }
    except Exception as e:
        logger.error("Error running anomaly detector for %s/%s: %s", project_id, experiment_id, e)
        return {
            "sampleSize": 0,
            "detectedMoment": None,
            "detectedMomentMs": None,
            "retentionDrop": None,
            "anomalyWindow": None,
        }

def compute_and_persist_detector(project_id: str, experiment_id: str) -> Dict[str, Any]:
    """Runs the anomaly detector against ClickHouse and persists computed metrics to Firestore."""
    detector_result = run_anomaly_detector(project_id, experiment_id)
    try:
        db = get_db()
        if db:
            doc_ref = db.collection('projects').document(project_id).collection('experiments').document(experiment_id).collection('hypotheses').document('current')
            doc = doc_ref.get()
            data = doc.to_dict() if doc.exists else {}
            data.update({
                "detectedMoment": detector_result.get("detectedMoment"),
                "detectedMomentMs": detector_result.get("detectedMomentMs"),
                "retentionDrop": detector_result.get("retentionDrop"),
                "anomalyWindow": detector_result.get("anomalyWindow"),
                "sampleSize": detector_result.get("sampleSize"),
            })
            doc_ref.set(data, merge=True)
            logger.info("Persisted detector metrics for %s/%s: %s", project_id, experiment_id, detector_result)
    except Exception as e:
        logger.error("Failed to persist detector metrics to Firestore: %s", e)
    return detector_result
