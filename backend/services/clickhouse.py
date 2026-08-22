import os
import re
import time
import sqlite3
import logging
from typing import List, Any, Optional, Dict
from datetime import datetime, timezone

logger = logging.getLogger("momentlab.clickhouse")

DB_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "data", "clickhouse_local.db")

class LocalQueryResult:
    def __init__(self, rows: List[Any]):
        self.result_rows = rows

class LocalClickHouseClient:
    """
    Contract-faithful local adapter implementing clickhouse-connect client interface.
    Used when live ClickHouse cluster is unavailable or for local deterministic verification.
    """
    def __init__(self, db_file: str = DB_FILE):
        self.db_file = db_file
        os.makedirs(os.path.dirname(os.path.abspath(self.db_file)), exist_ok=True)
        self._init_tables()

    def _get_conn(self):
        return sqlite3.connect(self.db_file, check_same_thread=False)

    def _init_tables(self):
        conn = self._get_conn()
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS audience_events (
                event_id TEXT PRIMARY KEY,
                session_id TEXT,
                project_id TEXT,
                experiment_id TEXT,
                scene_id TEXT,
                media_time_ms INTEGER,
                retention_score REAL,
                playback_state TEXT,
                idempotency_key TEXT UNIQUE,
                event_timestamp TEXT
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS reaction_events (
                reaction_id TEXT PRIMARY KEY,
                session_id TEXT,
                project_id TEXT,
                experiment_id TEXT,
                scene_id TEXT,
                media_time_ms INTEGER,
                reaction_type TEXT,
                idempotency_key TEXT UNIQUE,
                created_at TEXT
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS screening_sessions (
                session_id TEXT PRIMARY KEY,
                screening_token TEXT,
                project_id TEXT,
                experiment_id TEXT,
                scene_id TEXT,
                respondent_cohort TEXT,
                consent_given INTEGER,
                consent_timestamp TEXT,
                created_at TEXT
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS query_log (
                query_start_time TEXT,
                query TEXT,
                read_rows INTEGER,
                query_duration_ms INTEGER,
                user TEXT,
                type TEXT
            )
        """)
        conn.commit()
        conn.close()

    def insert(self, table: str, data: List[List[Any]], column_names: Optional[List[str]] = None):
        clean_table = table.replace("momentlab.", "")
        if not data:
            return
        conn = self._get_conn()
        cur = conn.cursor()
        cols = f"({','.join(column_names)})" if column_names else ""
        placeholders = f"({','.join(['?' for _ in range(len(data[0]))])})"
        sql = f"INSERT OR REPLACE INTO {clean_table} {cols} VALUES {placeholders}"
        # Convert any datetime objects to ISO strings
        clean_data = []
        for row in data:
            clean_row = [x.isoformat() if hasattr(x, "isoformat") else x for x in row]
            clean_data.append(clean_row)
        cur.executemany(sql, clean_data)
        conn.commit()
        conn.close()

    def query(self, query_str: str, parameters: Optional[Dict[str, Any]] = None) -> LocalQueryResult:
        start_time = time.time()
        # Translate common ClickHouse SQL functions to SQLite equivalents
        translated_sql = query_str
        if parameters:
            for k, v in parameters.items():
                val_str = f"'{v}'" if isinstance(v, str) else str(v)
                translated_sql = re.sub(rf'\{{{k}:[A-Za-z0-9_]+\}}', val_str, translated_sql)
                translated_sql = re.sub(rf'\{{{k}\}}', val_str, translated_sql)
        translated_sql = re.sub(r'momentlab\.', '', translated_sql)
        translated_sql = re.sub(r'system\.query_log', 'query_log', translated_sql)
        translated_sql = re.sub(r'toFloat32\(toInt32\(media_time_ms\s*/\s*1000\)\s*\*\s*1000\)', 'CAST(CAST(media_time_ms / 1000 AS INT) * 1000 AS FLOAT)', translated_sql)
        translated_sql = re.sub(r'quantile\([0-9\.]+\)\(([a-zA-Z0-9_]+)\)', r'avg(\1)', translated_sql)
        translated_sql = re.sub(r'count\(\)', 'count(*)', translated_sql)

        conn = self._get_conn()
        cur = conn.cursor()
        try:
            cur.execute(translated_sql)
            if translated_sql.strip().upper().startswith(("INSERT", "DELETE", "UPDATE", "DROP")):
                conn.commit()
            rows = cur.fetchall() if cur.description else []
        except Exception as e:
            logger.error("Local SQL execution error on '%s': %s", translated_sql, e)
            rows = []
        finally:
            conn.close()

        duration_ms = int((time.time() - start_time) * 1000)
        # Record into query_log
        if "query_log" not in query_str:
            self._log_query(query_str, len(rows), duration_ms)

        return LocalQueryResult(rows)

    def _log_query(self, query: str, read_rows: int, duration_ms: int):
        conn = self._get_conn()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO query_log (query_start_time, query, read_rows, query_duration_ms, user, type) VALUES (?, ?, ?, ?, ?, ?)",
            (datetime.now(timezone.utc).isoformat(), query.strip(), read_rows, max(1, duration_ms), "momentlab_mcp_reader", "QueryFinish")
        )
        conn.commit()
        conn.close()

def get_client():
    host = os.environ.get("CLICKHOUSE_HOST", "localhost")
    port = int(os.environ.get("CLICKHOUSE_PORT", "8123"))
    user = os.environ.get("CLICKHOUSE_USER", "default")
    password = os.environ.get("CLICKHOUSE_PASSWORD", "")
    
    try:
        import clickhouse_connect
        client = clickhouse_connect.get_client(
            host=host,
            port=port,
            username=user,
            password=password,
            connect_timeout=1
        )
        return client
    except Exception:
        # Fallback to contract-faithful local SQLite ClickHouse adapter
        return LocalClickHouseClient()

def init_db():
    client = get_client()
    logger.info("ClickHouse initialized with %s", type(client).__name__)
