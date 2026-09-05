import os
import clickhouse_connect
from dotenv import load_dotenv
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("grant_query_log")

load_dotenv('.env')

def main():
    host = os.getenv("CLICKHOUSE_HOST", "localhost")
    port = int(os.getenv("CLICKHOUSE_PORT", "8123"))
    user = os.getenv("CLICKHOUSE_ADMIN_USER", "default")
    password = os.getenv("CLICKHOUSE_ADMIN_PASSWORD", "")
    
    try:
        client = clickhouse_connect.get_client(
            host=host,
            port=port,
            username=user,
            password=password
        )
        logger.info("Connected as admin. Granting permissions...")
        client.command("GRANT SELECT ON system.query_log TO momentlab_writer;")
        client.command("GRANT SELECT ON system.query_log TO momentlab_mcp_reader;")
        client.command("GRANT REMOTE ON *.* TO momentlab_writer;")
        client.command("GRANT REMOTE ON *.* TO momentlab_mcp_reader;")
        logger.info("Permissions granted successfully!")
    except Exception as e:
        logger.error(f"Failed to grant permissions: {e}")

if __name__ == "__main__":
    main()
