"""
Rebuilds ClickHouse Materialized Aggregated Views from raw source tables.
Used when raw rows are deleted or modified in `audience_events` or `reaction_events`,
since ClickHouse Materialized Views are insert-triggered and do not automatically reflect raw table deletes.
"""

import logging
import sys
from backend.services.clickhouse import get_client, get_db_name
from backend.services.detector import compute_and_persist_detector

from backend.scripts.seed_clickhouse import RETENTION_MV_SELECT_BODY

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("momentlab.scripts.rebuild_mvs")

def rebuild_materialized_views():
    client = get_client()
    db_name = get_db_name()
    logger.info("Starting Materialized View rebuild for database: %s", db_name)

    # 1. Drop and re-create MV with cohort-aware definition
    logger.info("Re-creating %s.retention_by_second_mv with cohort-aware definition...", db_name)
    client.query(f"DROP VIEW IF EXISTS {db_name}.retention_by_second_mv")
    client.query(
        f"CREATE MATERIALIZED VIEW IF NOT EXISTS {db_name}.retention_by_second_mv TO {db_name}.retention_by_second_aggregated AS "
        + RETENTION_MV_SELECT_BODY.format(db_name=db_name)
    )

    # 2. Truncate aggregated target tables
    logger.info("Truncating %s.retention_by_second_aggregated...", db_name)
    client.query(f"TRUNCATE TABLE IF EXISTS {db_name}.retention_by_second_aggregated")

    logger.info("Truncating %s.reaction_anomalies_aggregated...", db_name)
    client.query(f"TRUNCATE TABLE IF EXISTS {db_name}.reaction_anomalies_aggregated")

    # 3. Re-populate retention_by_second_aggregated from audience_events LEFT JOIN screening_sessions
    q_rebuild_retention = (
        f"INSERT INTO {db_name}.retention_by_second_aggregated "
        + RETENTION_MV_SELECT_BODY.format(db_name=db_name)
    )
    logger.info("Repopulating retention_by_second_aggregated from audience_events LEFT JOIN screening_sessions...")
    client.query(q_rebuild_retention)

    # 4. Log distinct cohorts and row count for verification
    res_count = client.query(f"SELECT count() FROM {db_name}.retention_by_second_aggregated")
    total_rows = res_count.result_rows[0][0] if res_count and res_count.result_rows else 0

    res_cohorts = client.query(f"SELECT DISTINCT respondent_cohort FROM {db_name}.retention_by_second_aggregated")
    distinct_cohorts = [r[0] for r in res_cohorts.result_rows] if res_cohorts and res_cohorts.result_rows else []

    logger.info("MV Rebuild step completed. Total aggregated rows: %d, Distinct cohorts: %s", total_rows, distinct_cohorts)

    # 5. Re-populate reaction_anomalies_aggregated from reaction_events
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

    # 6. Recompute and persist detector metrics to Firestore
    logger.info("Recomputing detector metrics for proj_northlight_01 / exp_23a...")
    res = compute_and_persist_detector("proj_northlight_01", "exp_23a")
    logger.info("MV Rebuild completed successfully. Detector result: %s", res)

if __name__ == "__main__":
    rebuild_materialized_views()
