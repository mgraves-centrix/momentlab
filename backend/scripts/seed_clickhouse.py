
import os
import sys
import logging
from backend.ingestion.batch_writer import ClickHouseBatchWriter
from backend.simulator.fixtures import generate_northlight_events_and_sessions

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_clickhouse")

def main():
    logger.info("Initializing ClickHouse Seeder for MomentLab...")
    writer = ClickHouseBatchWriter()
    
    if not writer.client:
        logger.warning("ClickHouse live connection not detected. Ensure CLICKHOUSE_HOST, CLICKHOUSE_USER, and CLICKHOUSE_PASSWORD are set in your environment.")
        logger.warning("Seeding into fallback in-memory buffer for testing...")
    else:
        logger.info("Connected to ClickHouse instance at %s:%s", writer.host, writer.port)

    # Generate 525 respondents with sessions and timeline events
    events, sessions = generate_northlight_events_and_sessions(count=525)
    logger.info("Generated %d simulated Northlight audience playback events across %d sessions.", len(events), len(sessions))

    # Insert sessions
    sess_res = writer.insert_screening_sessions(sessions)
    logger.info("Screening Sessions Result: %s (Inserted %d rows)", sess_res["status"], sess_res.get("inserted_count", 0))

    # Insert events
    res = writer.insert_playback_events(events)
    logger.info("Playback Events Result: %s (Inserted %d rows)", res["status"], res.get("inserted_count", 0))
    logger.info("Seeding Completed Successfully!")

if __name__ == "__main__":
    main()
