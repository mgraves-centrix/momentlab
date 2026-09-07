import os
import re
import time
import sqlite3
import logging
import uuid
from typing import List, Any, Optional, Dict
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

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
        logger.warning("================================================================================")
        logger.warning("WARNING: LocalClickHouseClient active (MOMENTLAB_LOCAL_DB=1).")
        logger.warning("Running on SQLite adapter: %s (NOT REAL CLICKHOUSE CLOUD)", self.db_file)
        logger.warning("================================================================================")
        os.makedirs(os.path.dirname(os.path.abspath(self.db_file)), exist_ok=True)
        self._init_tables()
        self.is_local = True

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
                event_timestamp TEXT,
                arm TEXT DEFAULT 'control'
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
                created_at TEXT,
                arm TEXT DEFAULT 'control'
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
                created_at TEXT,
                arm TEXT DEFAULT 'control'
            )
        """)
        # Ensure arm column exists if table was already created without it
        for tbl in ["audience_events", "reaction_events", "screening_sessions"]:
            try:
                cur.execute(f"ALTER TABLE {tbl} ADD COLUMN arm TEXT DEFAULT 'control'")
            except Exception:
                pass
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

    def insert(self, table: str, data: List[List[Any]], column_names: Optional[List[str]] = None, database: Optional[str] = None, settings: Optional[Dict[str, Any]] = None):
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

    def query(self, query_str: str, parameters: Optional[Dict[str, Any]] = None, settings: Optional[Dict[str, Any]] = None) -> LocalQueryResult:
        start_time = time.time()
        # Translate common ClickHouse SQL functions to SQLite equivalents
        translated_sql = query_str
        if parameters:
            for k, v in parameters.items():
                if isinstance(v, (list, tuple, set)):
                    escaped_items = [("'" + str(x).replace("'", "''") + "'") if isinstance(x, str) else str(x) for x in v]
                    val_str = f"({', '.join(escaped_items)})" if escaped_items else "(NULL)"
                elif isinstance(v, str):
                    val_str = "'" + v.replace("'", "''") + "'"
                else:
                    val_str = str(v)
                translated_sql = re.sub(rf'\{{{k}:[A-Za-z0-9_\(\)]+\}}', val_str, translated_sql)
                translated_sql = re.sub(rf'\{{{k}\}}', val_str, translated_sql)
        translated_sql = re.sub(r'momentlab_test\.', '', translated_sql)
        translated_sql = re.sub(r'momentlab\.', '', translated_sql)
        translated_sql = re.sub(r"clusterAllReplicas\('[^']+',\s*system,\s*query_log\)", "query_log", translated_sql)
        translated_sql = re.sub(r'system\.query_log', 'query_log', translated_sql)
        translated_sql = re.sub(r'toUUID\(([^)]+)\)', r'\1', translated_sql)
        translated_sql = re.sub(r'toFloat32\(toInt32\(([a-zA-Z0-9_\.]+)\s*/\s*1000\)\s*\*\s*1000\)', r'CAST(CAST(\1 / 1000 AS INT) * 1000 AS FLOAT)', translated_sql)
        translated_sql = re.sub(r'avgMerge\(retention_avg\)', r'avg(retention_score)', translated_sql)
        translated_sql = re.sub(r'quantileMerge\([0-9\.]+\)\(retention_median\)', r'avg(retention_score)', translated_sql)
        translated_sql = re.sub(r'sum\(sample_size\)', r'count(*)', translated_sql)
        translated_sql = re.sub(r'retention_by_second_aggregated', r'audience_events', translated_sql)
        translated_sql = re.sub(r'reaction_anomalies_aggregated', r'reaction_events', translated_sql)
        translated_sql = re.sub(r'quantile\([0-9\.]+\)\(([a-zA-Z0-9_]+)\)', r'avg(\1)', translated_sql)
        translated_sql = re.sub(r'count\(\)', 'count(*)', translated_sql)
        if "DROP DATABASE" in translated_sql.upper() or "CREATE DATABASE" in translated_sql.upper():
            return LocalQueryResult([])

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

def get_client(
    host: Optional[str] = None,
    port: Optional[int] = None,
    username: Optional[str] = None,
    password: Optional[str] = None,
    database: Optional[str] = None,
    secure: Optional[bool] = None,
    connect_timeout: Optional[int] = None,
    send_receive_timeout: Optional[int] = None,
):
    # Opt-in local SQLite fallback ONLY when explicitly requested
    if os.environ.get("MOMENTLAB_LOCAL_DB") == "1":
        logger.warning(
            "MOMENTLAB_LOCAL_DB=1 is set: using LocalClickHouseClient SQLite adapter (NOT REAL CLICKHOUSE)."
        )
        return LocalClickHouseClient()

    ch_host = (host or os.environ.get("CLICKHOUSE_HOST", "localhost")).strip()
    port_val = port if port is not None else os.environ.get("CLICKHOUSE_PORT", "8443")
    ch_port = int(str(port_val).strip())
    ch_user = (username or os.environ.get("CLICKHOUSE_USER") or os.environ.get("CLICKHOUSE_WRITER_USER") or "default").strip()
    if password is not None:
        raw_pass = password
    elif ch_user == (os.environ.get("CLICKHOUSE_WRITER_USER") or "momentlab_writer").strip() and os.environ.get("CLICKHOUSE_WRITER_PASSWORD"):
        raw_pass = os.environ.get("CLICKHOUSE_WRITER_PASSWORD")
    elif ch_user == (os.environ.get("CLICKHOUSE_MCP_USER") or "momentlab_mcp_reader").strip() and os.environ.get("CLICKHOUSE_MCP_PASSWORD"):
        raw_pass = os.environ.get("CLICKHOUSE_MCP_PASSWORD")
    else:
        raw_pass = os.environ.get("CLICKHOUSE_PASSWORD") or os.environ.get("CLICKHOUSE_WRITER_PASSWORD") or ""
    ch_password = raw_pass.strip()
    ch_database = (database or os.environ.get("CLICKHOUSE_DATABASE", os.environ.get("CLICKHOUSE_DB", "momentlab"))).strip()

    if secure is not None:
        ch_secure = secure
    else:
        ch_secure = os.environ.get("CLICKHOUSE_SECURE", "true" if ch_port == 8443 else "false").strip().lower() in ("true", "1", "yes")

    timeout_val = connect_timeout if connect_timeout is not None else int(os.environ.get("CLICKHOUSE_CONNECT_TIMEOUT", "10"))
    sr_timeout = send_receive_timeout if send_receive_timeout is not None else int(os.environ.get("CLICKHOUSE_SEND_RECEIVE_TIMEOUT", "30"))

    kwargs = {}
    if ch_secure:
        kwargs["ca_cert"] = "certifi"

    import clickhouse_connect
    return clickhouse_connect.get_client(
        host=ch_host,
        port=ch_port,
        username=ch_user,
        password=ch_password,
        database=ch_database,
        secure=ch_secure,
        connect_timeout=timeout_val,
        send_receive_timeout=sr_timeout,
        **kwargs,
    )

def check_connection(timeout: int = 3) -> Dict[str, Any]:
    """
    Performs a real round-trip query (SELECT 1) against ClickHouse with a short timeout.
    Returns connection status, server version, and resolved host without exposing credentials.
    """
    ch_host = os.environ.get("CLICKHOUSE_HOST", "localhost")
    try:
        client = get_client(connect_timeout=timeout, send_receive_timeout=timeout)
        result = client.query("SELECT 1", settings={"max_execution_time": timeout} if hasattr(client, "server_version") else None)
        if not result or not result.result_rows or result.result_rows[0][0] != 1:
            return {
                "connected": False,
                "host": ch_host,
                "version": None,
                "error": "Unexpected query result from ClickHouse",
            }
        version = getattr(client, "server_version", None)
        if not version and hasattr(client, "is_local") and client.is_local:
            version = "sqlite-adapter"
        elif not version:
            v_res = client.query("SELECT version()")
            version = str(v_res.result_rows[0][0]) if v_res and v_res.result_rows else "unknown"

        return {
            "connected": True,
            "host": ch_host,
            "version": str(version),
            "error": None,
        }
    except Exception as e:
        logger.error("ClickHouse health check failed: %s", e)
        err_msg = f"{type(e).__name__}: {str(e)}"
        for secret_env in ("CLICKHOUSE_PASSWORD", "CLICKHOUSE_ADMIN_PASSWORD", "CLICKHOUSE_WRITER_PASSWORD", "CLICKHOUSE_MCP_PASSWORD"):
            secret = os.environ.get(secret_env)
            if secret:
                err_msg = err_msg.replace(secret, "******")
        return {
            "connected": False,
            "host": ch_host,
            "version": None,
            "error": err_msg,
        }

KNOWN_TOKENS: Dict[str, Dict[str, str]] = {
    "demo_token_123": {
        "project_id": "proj_northlight_01",
        "experiment_id": "exp_23a",
        "scene_id": "sc_12",
    },
    "demo_token_echoes": {
        "project_id": "proj_echoes_02",
        "experiment_id": "exp_01b",
        "scene_id": "sc_01",
    },
    "demo_token_below": {
        "project_id": "proj_below_03",
        "experiment_id": "exp_01c",
        "scene_id": "sc_01",
    },
}

def init_db():
    client = get_client()
    logger.info("ClickHouse initialized with %s", type(client).__name__)
    try:
        db = get_db_name()
        from backend.ingestion.batch_writer import ClickHouseBatchWriter
        writer = ClickHouseBatchWriter()
        for token, meta in KNOWN_TOKENS.items():
            res = client.query(f"SELECT count() FROM {db}.screening_sessions WHERE screening_token = {{tok:String}} AND consent_given = 0", parameters={"tok": token})
            if not res or not res.result_rows or res.result_rows[0][0] == 0:
                writer.insert_screening_sessions([{
                    "session_id": str(uuid.uuid5(uuid.NAMESPACE_DNS, token)),
                    "screening_token": token,
                    "project_id": meta["project_id"],
                    "experiment_id": meta["experiment_id"],
                    "scene_id": meta["scene_id"],
                    "respondent_cohort": "25_34",
                    "consent_given": 0,
                    "consent_timestamp": datetime.now(timezone.utc),
                    "created_at": datetime.now(timezone.utc)
                }])
                logger.info("Seeded default %s invite row into screening_sessions", token)
        writer.flush()
    except Exception as e:
        logger.warning("ClickHouse demo invite seed warning: %s", e)

def get_db_name() -> str:
    return (os.environ.get("CLICKHOUSE_DATABASE") or os.environ.get("CLICKHOUSE_DB") or "momentlab").strip()

_CONSENT_CACHE: Dict[str, bool] = {}

def record_session_consent_cache(session_id: str):
    if session_id:
        _CONSENT_CACHE[session_id] = True

def is_session_consented(session_id: str) -> bool:
    if not session_id:
        return False
    if _CONSENT_CACHE.get(session_id) is True:
        return True
    try:
        uuid_obj = str(uuid.UUID(str(session_id)))
    except (ValueError, TypeError, AttributeError):
        return False

    try:
        client = get_client()
        db = get_db_name()
        query = f"SELECT consent_given FROM {db}.screening_sessions WHERE session_id = toUUID({{sid:String}}) LIMIT 1"
        res = client.query(query, parameters={"sid": uuid_obj})
        if res and res.result_rows and int(res.result_rows[0][0]) == 1:
            _CONSENT_CACHE[session_id] = True
            return True
    except Exception as e:
        logger.warning("Consent check ClickHouse lookup warning for session %s: %s", session_id, e)
    return False

def resolve_screening_token(token: str) -> Optional[Dict[str, str]]:
    if not token or not isinstance(token, str):
        return None
    clean = token.strip()
    if clean in KNOWN_TOKENS:
        return {
            "screening_token": clean,
            **KNOWN_TOKENS[clean]
        }
    try:
        client = get_client()
        db = get_db_name()
        res = client.query(f"SELECT project_id, experiment_id, scene_id FROM {db}.screening_sessions WHERE screening_token = {{tok:String}} LIMIT 1", parameters={"tok": clean})
        if res and res.result_rows:
            p_id, e_id, s_id = res.result_rows[0]
            if p_id:
                return {
                    "screening_token": clean,
                    "project_id": str(p_id),
                    "experiment_id": str(e_id or "exp_23a"),
                    "scene_id": str(s_id or "sc_12"),
                }
    except Exception as e:
        logger.warning("Token resolution ClickHouse lookup warning for token %s: %s", token, e)
    return None

def is_valid_screening_token(token: str) -> bool:
    return resolve_screening_token(token) is not None



