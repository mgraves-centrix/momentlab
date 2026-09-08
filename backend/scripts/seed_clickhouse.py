import os
import sys
import logging
from backend.ingestion.batch_writer import ClickHouseBatchWriter
from backend.simulator.fixtures import generate_scaled_events_and_sessions
from backend.services.clickhouse import get_client, get_db_name

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_clickhouse")

RETENTION_MV_SELECT_BODY = """
    SELECT
        ae.project_id AS project_id,
        ae.experiment_id AS experiment_id,
        ae.scene_id AS scene_id,
        coalesce(ss.respondent_cohort, 'unknown') AS respondent_cohort,
        ae.media_time_ms AS media_time_ms,
        count() AS sample_size,
        avgState(ae.retention_score) AS retention_avg,
        quantileState(0.5)(ae.retention_score) AS retention_median,
        quantileState(0.1)(ae.retention_score) AS retention_p10,
        quantileState(0.9)(ae.retention_score) AS retention_p90
    FROM {db_name}.audience_events ae
    LEFT JOIN {db_name}.screening_sessions ss ON ae.session_id = ss.session_id
    GROUP BY project_id, experiment_id, scene_id, respondent_cohort, media_time_ms
"""

def main():
    logger.info("Initializing ClickHouse Seeder for MomentLab...")
    writer = ClickHouseBatchWriter()
    db_name = get_db_name()
    
    if not writer.client:
        logger.warning("ClickHouse live connection not detected. Ensure CLICKHOUSE_HOST, CLICKHOUSE_USER, and CLICKHOUSE_PASSWORD are set in your environment.")
        logger.warning("Seeding into fallback in-memory buffer for testing...")
    else:
        logger.info("Connected to ClickHouse instance at %s:%s (Database: %s)", writer.host, writer.port, db_name)

    # Ensure arm column exists on live or local ClickHouse tables
    if writer.client:
        for tbl in ["audience_events", "screening_sessions", "reaction_events"]:
            try:
                writer.client.query(f"ALTER TABLE {db_name}.{tbl} ADD COLUMN IF NOT EXISTS arm String DEFAULT 'control'")
            except Exception as e:
                logger.warning("Migration warning for %s.arm: %s", tbl, e)

    # 1. Provision / Update Materialized Views & Aggregates DDL in ClickHouse
    if writer.client and not getattr(writer.client, "is_local", False):
        try:
            logger.info("Ensuring Materialized Views and Aggregating Tables exist...")
            writer.client.query(f"DROP VIEW IF EXISTS {db_name}.retention_by_second_mv")
            writer.client.query(f"DROP TABLE IF EXISTS {db_name}.retention_by_second_aggregated")
            writer.client.query(f"DROP VIEW IF EXISTS {db_name}.reaction_anomalies_mv")
            writer.client.query(f"DROP TABLE IF EXISTS {db_name}.reaction_anomalies_aggregated")

            writer.client.query(f"""
                CREATE TABLE IF NOT EXISTS {db_name}.retention_by_second_aggregated (
                    project_id String,
                    experiment_id String,
                    scene_id String,
                    respondent_cohort String,
                    media_time_ms UInt32,
                    sample_size SimpleAggregateFunction(sum, UInt64),
                    retention_avg AggregateFunction(avg, Float32),
                    retention_median AggregateFunction(quantile(0.5), Float32),
                    retention_p10 AggregateFunction(quantile(0.1), Float32),
                    retention_p90 AggregateFunction(quantile(0.9), Float32)
                ) ENGINE = AggregatingMergeTree()
                ORDER BY (project_id, scene_id, experiment_id, respondent_cohort, media_time_ms);
            """)
            writer.client.query(
                f"CREATE MATERIALIZED VIEW IF NOT EXISTS {db_name}.retention_by_second_mv TO {db_name}.retention_by_second_aggregated AS "
                + RETENTION_MV_SELECT_BODY.format(db_name=db_name)
            )
            writer.client.query(f"""
                CREATE TABLE IF NOT EXISTS {db_name}.reaction_anomalies_aggregated (
                    project_id String,
                    scene_id String,
                    media_time_ms UInt32,
                    confused_count SimpleAggregateFunction(sum, UInt64),
                    engaging_count SimpleAggregateFunction(sum, UInt64),
                    bored_count SimpleAggregateFunction(sum, UInt64)
                ) ENGINE = SummingMergeTree()
                ORDER BY (project_id, scene_id, media_time_ms);
            """)
            writer.client.query(f"""
                CREATE MATERIALIZED VIEW IF NOT EXISTS {db_name}.reaction_anomalies_mv TO {db_name}.reaction_anomalies_aggregated AS
                SELECT
                    project_id,
                    scene_id,
                    media_time_ms,
                    countIf(reaction_type = 'CONFUSED') AS confused_count,
                    countIf(reaction_type = 'ENGAGING') AS engaging_count,
                    countIf(reaction_type = 'BORED') AS bored_count
                FROM {db_name}.reaction_events
                GROUP BY project_id, scene_id, media_time_ms;
            """)
        except Exception as ddl_err:
            logger.warning("DDL creation warning: %s", ddl_err)

    # 2. Generate scaled deterministic dataset across all 3 project shells
    logger.info("Generating scaled deterministic audience events, screening sessions, and reaction events...")
    events, sessions, reactions = generate_scaled_events_and_sessions(
        northlight_count=35000,
        echoes_count=10000,
        below_count=10000
    )
    logger.info(
        "Generated dataset: %d audience playback events across %d sessions, and %d reaction events.",
        len(events), len(sessions), len(reactions)
    )

    # 3. Truncate existing data to cleanly reseed scaled dataset if needed
    if writer.client:
        try:
            logger.info("Truncating existing tables for clean scaled re-seed...")
            writer.client.query(f"TRUNCATE TABLE IF EXISTS {db_name}.retention_by_second_aggregated")
            writer.client.query(f"TRUNCATE TABLE IF EXISTS {db_name}.reaction_anomalies_aggregated")
            writer.client.query(f"TRUNCATE TABLE IF EXISTS {db_name}.audience_events")
            writer.client.query(f"TRUNCATE TABLE IF EXISTS {db_name}.screening_sessions")
            writer.client.query(f"TRUNCATE TABLE IF EXISTS {db_name}.reaction_events")
        except Exception as trunc_err:
            logger.warning("Truncate warning: %s", trunc_err)

    # 4. Bulk insert sessions
    logger.info("Inserting screening sessions...")
    sess_batch_size = 10000
    for i in range(0, len(sessions), sess_batch_size):
        chunk = sessions[i:i+sess_batch_size]
        writer.insert_screening_sessions(chunk)

    # 5. Bulk insert audience events
    logger.info("Inserting audience playback events in chunks...")
    event_batch_size = 100000
    for i in range(0, len(events), event_batch_size):
        chunk = events[i:i+event_batch_size]
        res = writer.insert_playback_events(chunk, skip_idempotency_query=True)
        logger.info("Inserted chunk %d..%d: %s", i, i + len(chunk), res.get("status"))

    # 6. Bulk insert reaction events (strictly normalized to uppercase)
    logger.info("Inserting reaction events...")
    writer.insert_reaction_events(reactions, skip_idempotency_query=True)

    # 7. Backfill / ensure aggregate tables are populated
    if writer.client and not getattr(writer.client, "is_local", False):
        try:
            logger.info("Backfilling aggregate tables from raw tables...")
            writer.client.query(f"""
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
                GROUP BY project_id, experiment_id, scene_id, media_time_ms;
            """)
            writer.client.query(f"""
                INSERT INTO {db_name}.reaction_anomalies_aggregated
                SELECT
                    project_id,
                    scene_id,
                    media_time_ms,
                    countIf(reaction_type = 'CONFUSED') AS confused_count,
                    countIf(reaction_type = 'ENGAGING') AS engaging_count,
                    countIf(reaction_type = 'BORED') AS bored_count
                FROM {db_name}.reaction_events
                GROUP BY project_id, scene_id, media_time_ms;
            """)
            logger.info("Aggregate tables backfilled successfully.")
        except Exception as bf_err:
            logger.warning("Aggregate backfill warning: %s", bf_err)

    logger.info("Seeding Completed Successfully!")

if __name__ == "__main__":
    main()

