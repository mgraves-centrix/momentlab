import os
from dotenv import load_dotenv
import logging
from backend.services.clickhouse import get_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("grant_query_log")

load_dotenv('.env')

def main():
    user = os.getenv("CLICKHOUSE_ADMIN_USER") or os.getenv("CLICKHOUSE_USER", "default")
    password = os.getenv("CLICKHOUSE_ADMIN_PASSWORD") or os.getenv("CLICKHOUSE_PASSWORD", "")
    
    try:
        client = get_client(username=user, password=password)
        logger.info("Connected to ClickHouse. Granting permissions...")
        client.command("GRANT SELECT ON system.query_log TO momentlab_writer;")
        client.command("GRANT SELECT ON system.query_log TO momentlab_mcp_reader;")
        client.command("GRANT REMOTE ON *.* TO momentlab_writer;")
        client.command("GRANT REMOTE ON *.* TO momentlab_mcp_reader;")
        logger.info("Permissions granted successfully!")
    except Exception as e:
        logger.error(f"Failed to grant permissions: {e}")

if __name__ == "__main__":
    main()

