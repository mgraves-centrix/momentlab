"""
Rebuilds ClickHouse Materialized Aggregated Views from raw source tables.
Used when raw rows are deleted or modified in `audience_events` or `reaction_events`,
since ClickHouse Materialized Views are insert-triggered and do not automatically reflect raw table deletes.
"""

import logging
import sys
from backend.services.clickhouse import get_client, get_db_name
from backend.services.detector import compute_and_persist_detector

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("momentlab.scripts.rebuild_mvs")

def rebuild_materialized_views():
    client = get_client()
    db_name = get_db_name()
    logger.info("Starting Materialized View rebuild for database: %s", db_name)

    # 1. Truncate aggregated target tables
    logger.info("Truncating %s.retention_by_second_aggregated...", db_name)
    client.query(f"TRUNCATE TABLE IF EXISTS {db_name}.retention_by_second_aggregated")

    logger.info("Truncating %s.reaction_anomalies_aggregated...", db_name)
    client.query(f"TRUNCATE TABLE IF EXISTS {db_name}.reaction_anomalies_aggregated")

    # 2. Re-populate retention_by_second_aggregated from audience_events
    q_rebuild_retention = f"""
        INSERT INTO {db_name}.retention_by_second_aggregated
        SELECT
            project_id,
            experiment_id,
            scene_id,
            'ALL' AS respondent_cohort,
            media_time_ms,
            count() AS sample_size,
            avgState(retention_score) AS retention_avg,
            quantileState(0.5)(retention_score) AS retention_median,
            quantileState(0.1)(retention_score) AS retention_p10,
            quantileState(0.9)(retention_score) AS retention_p90
        FROM {db_name}.audience_events
        GROUP BY project_id, experiment_id, scene_id, media_time_ms
    """
    logger.info("Repopulating retention_by_second_aggregated from audience_events...")
    client.query(q_rebuild_retention)

    # 3. Re-populate reaction_anomalies_aggregated from reaction_events
    q_rebuild_reactions = f"""
        INSERT INTO {db_name}.reaction_anomalies_aggregated
        SELECT
            project_id,
            scene_id,
            media_time_ms,
            countIf(reaction_type = 'CONFUSED') AS confused_count,
            countIf(reaction_type = 'ENGAGING') AS engaging_count,
            countIf(reaction_type = 'BORED') AS bored_count
        FROM {db_name}.reaction_events
        GROUP BY project_id, scene_id, media_time_ms
    """
    logger.info("Repopulating reaction_anomalies_aggregated from reaction_events...")
    client.query(q_rebuild_reactions)

    # 4. Recompute and persist detector metrics to Firestore
    logger.info("Recomputing detector metrics for proj_northlight_01 / exp_23a...")
    res = compute_and_persist_detector("proj_northlight_01", "exp_23a")
    logger.info("MV Rebuild completed successfully. Detector result: %s", res)

if __name__ == "__main__":
    rebuild_materialized_views()
