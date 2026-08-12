import os
import clickhouse_connect

def get_client():
    # Use environment variables for ClickHouse connection (defaults to local for testing)
    host = os.environ.get("CLICKHOUSE_HOST", "localhost")
    port = int(os.environ.get("CLICKHOUSE_PORT", "8123"))
    user = os.environ.get("CLICKHOUSE_USER", "default")
    password = os.environ.get("CLICKHOUSE_PASSWORD", "")
    
    return clickhouse_connect.get_client(
        host=host,
        port=port,
        username=user,
        password=password
    )

def init_db():
    client = get_client()
    print("ClickHouse init check passed.")

