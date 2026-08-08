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
    # Create the telemetry_events table
    client.command("""
        CREATE TABLE IF NOT EXISTS telemetry_events (
            timestamp DateTime64(3),
            session_id String,
            project_id String,
            experiment_id String,
            media_time_ms Int32,
            event_type String,
            value Float32
        ) ENGINE = MergeTree()
        ORDER BY (project_id, experiment_id, media_time_ms)
    """)
    print("ClickHouse telemetry_events table initialized.")

def insert_events(events: list):
    """
    events is a list of tuples or lists matching the table columns:
    (timestamp, session_id, project_id, experiment_id, media_time_ms, event_type, value)
    """
    client = get_client()
    client.insert('telemetry_events', events, column_names=[
        'timestamp', 'session_id', 'project_id', 'experiment_id', 'media_time_ms', 'event_type', 'value'
    ])
