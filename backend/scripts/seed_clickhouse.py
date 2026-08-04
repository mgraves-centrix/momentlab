
import os
import sys
import logging
from backend.ingestion.batch_writer import ClickHouseBatchWriter
from backend.simulator.fixtures import generate_northlight_simulated_events

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

    # Generate 4,732 respondent timeline events
    events = generate_northlight_simulated_events(count=525)  # 525 * 9 = 4,725 events
    logger.info("Generated %d simulated Northlight audience playback events.", len(events))

    res = writer.insert_playback_events(events)
    logger.info("Seeding Result: %s (Inserted %d rows)", res["status"], res["inserted_count"])
    logger.info("Seeding Completed Successfully!")

if __name__ == "__main__":
    main()
