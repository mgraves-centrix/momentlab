import logging
from typing import Optional, Dict, Any
from backend.services.clickhouse import get_client, get_db_name
from backend.services import db

logger = logging.getLogger("momentlab.services.detector")

def run_anomaly_detector(project_id: str, experiment_id: str) -> Dict[str, Any]:
    """Computes anomaly metrics server-side from ClickHouse audience_events."""
    try:
        client = get_client()
        db_name = get_db_name()
        
        query_respondents = f"""
            SELECT count(DISTINCT session_id) 
            FROM {db_name}.audience_events 
            WHERE project_id = {{project_id:String}} AND experiment_id = {{experiment_id:String}}
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
                "confusionSpikeMoment": None,
                "confusionSpikeMagnitude": None,
                "confusionWindow": None,
            }

        q_timeline = f"""
            SELECT media_time_ms as time_bucket, avgMerge(retention_avg) as avg_val, sum(sample_size) as total_samples
            FROM {db_name}.retention_by_second_aggregated
            WHERE project_id = {{project_id:String}} AND experiment_id = {{experiment_id:String}}
            GROUP BY time_bucket
            ORDER BY time_bucket
        """
        t_res = client.query(q_timeline, parameters={'project_id': project_id, 'experiment_id': experiment_id})
        
        detected_moment = None
        detected_moment_ms = None
        retention_drop = None
        anomaly_window = None

        if t_res.result_rows and len(t_res.result_rows) >= 5:
            min_sample_threshold = max(10, int(total_respondents * 0.02))
            pts = [
                (int(r[0]), float(r[1]))
                for r in t_res.result_rows
                if len(r) < 3 or r[2] is None or int(r[2]) >= min_sample_threshold
            ]
            if pts and len(pts) >= 5:
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

        # Confusion Spike Detection (Fail-open)
        confusion_spike_moment = None
        confusion_spike_magnitude = None
        confusion_window = None

        try:
            q_conf = f"""
                SELECT media_time_ms as time_bucket, sum(confused_count) as confused_cnt
                FROM {db_name}.reaction_anomalies_aggregated
                WHERE project_id = {{project_id:String}}
                GROUP BY time_bucket
                ORDER BY time_bucket
            """
            c_res = client.query(q_conf, parameters={'project_id': project_id})
            if c_res.result_rows:
                conf_by_bucket = {int(r[0]): int(r[1]) for r in c_res.result_rows}
                
                ret_samples_by_bucket = {}
                if t_res.result_rows:
                    for r in t_res.result_rows:
                        ret_samples_by_bucket[int(r[0])] = int(r[2]) if (len(r) >= 3 and r[2] is not None) else total_respondents
                
                all_buckets = sorted(set(list(ret_samples_by_bucket.keys()) + list(conf_by_bucket.keys())))
                min_sample_threshold = max(10, int(total_respondents * 0.02))
                
                c_pts = []
                for b in all_buckets:
                    samp = ret_samples_by_bucket.get(b, total_respondents)
                    if samp >= min_sample_threshold:
                        cnt = conf_by_bucket.get(b, 0)
                        rate = (cnt / float(total_respondents)) * 100.0
                        c_pts.append((b, rate))
                
                if c_pts and len(c_pts) >= 5:
                    c_baseline = sum(p[1] for p in c_pts[:min(10, len(c_pts))]) / min(10, len(c_pts))
                    max_c_pt = max(c_pts, key=lambda p: p[1])
                    spike_val = max_c_pt[1] - c_baseline
                    if spike_val >= 3.0:
                        spike_ms = max_c_pt[0]
                        c_s_sec = spike_ms // 1000
                        c_st_sec = max(0, spike_ms - 4000) // 1000
                        c_en_sec = (spike_ms + 4000) // 1000
                        confusion_spike_moment = f"{c_s_sec // 60:02d}:{c_s_sec % 60:02d}"
                        confusion_spike_magnitude = f"+{round(spike_val, 1)}%"
                        confusion_window = f"{c_st_sec // 60:02d}:{c_st_sec % 60:02d}–{c_en_sec // 60:02d}:{c_en_sec % 60:02d}"
        except Exception as conf_err:
            logger.warning("Failed to run confusion detector for %s: %s", project_id, conf_err)

        return {
            "sampleSize": total_respondents,
            "detectedMoment": detected_moment,
            "detectedMomentMs": detected_moment_ms,
            "retentionDrop": retention_drop,
            "anomalyWindow": anomaly_window,
            "confusionSpikeMoment": confusion_spike_moment,
            "confusionSpikeMagnitude": confusion_spike_magnitude,
            "confusionWindow": confusion_window,
        }
    except Exception as e:
        logger.error("Error running anomaly detector for %s/%s: %s", project_id, experiment_id, e)
        return {
            "sampleSize": 0,
            "detectedMoment": None,
            "detectedMomentMs": None,
            "retentionDrop": None,
            "anomalyWindow": None,
            "confusionSpikeMoment": None,
            "confusionSpikeMagnitude": None,
            "confusionWindow": None,
        }

def compute_and_persist_detector(project_id: str, experiment_id: str) -> Dict[str, Any]:
    """Runs the anomaly detector against ClickHouse and persists computed metrics to Firestore."""
    detector_result = run_anomaly_detector(project_id, experiment_id)
    try:
        firestore_db = db.get_db()
        if firestore_db:
            doc_ref = firestore_db.collection('projects').document(project_id).collection('experiments').document(experiment_id).collection('hypotheses').document('current')
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
