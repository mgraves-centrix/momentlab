-- MomentLab ClickHouse User & Permission Initialization
-- Database: momentlab

CREATE DATABASE IF NOT EXISTS momentlab;

-- 1. Create ingestion writer user (FastAPI Event Ingestion)
CREATE USER IF NOT EXISTS momentlab_writer IDENTIFIED WITH double_sha1_password BY 'momentlab_writer_secret_change_me';
GRANT USAGE ON momentlab.* TO momentlab_writer;
GRANT INSERT, SELECT ON momentlab.* TO momentlab_writer;

-- 2. Create read-only MCP user (Official ClickHouse MCP Server)
CREATE USER IF NOT EXISTS momentlab_mcp_reader IDENTIFIED WITH double_sha1_password BY 'momentlab_mcp_reader_secret_change_me';
GRANT USAGE ON momentlab.* TO momentlab_mcp_reader;
GRANT SELECT ON momentlab.* TO momentlab_mcp_reader;

-- 3. Verify users created
SELECT name, auth_type FROM system.users WHERE name LIKE 'momentlab_%';
