-- MomentLab ClickHouse Schema DDL
-- Database: momentlab
-- Ingestion Identity: momentlab_writer (INSERT only)
-- Reader Identity: momentlab_mcp_reader (SELECT only)

CREATE DATABASE IF NOT EXISTS momentlab;

USE momentlab;

-- Screening sessions table
CREATE TABLE IF NOT EXISTS screening_sessions (
    session_id UUID,
    screening_token String,
    project_id String,
    experiment_id String,
    scene_id String,
    respondent_cohort String,
    consent_given UInt8,
    consent_timestamp DateTime64(3, 'UTC'),
    created_at DateTime64(3, 'UTC') DEFAULT now64()
) ENGINE = MergeTree()
ORDER BY (project_id, experiment_id, session_id);

-- Second-by-second audience playback & retention events
CREATE TABLE IF NOT EXISTS audience_events (
    event_id UUID,
    session_id UUID,
    project_id String,
    experiment_id String,
    scene_id String,
    media_time_ms UInt32,
    retention_score Float32,
    playback_state String, -- PLAYING, PAUSED, SEEKING
    idempotency_key String,
    event_timestamp DateTime64(3, 'UTC')
) ENGINE = MergeTree()
ORDER BY (project_id, scene_id, media_time_ms, event_timestamp);

-- Explicit reaction events (CONFUSED, ENGAGING, BORED)
CREATE TABLE IF NOT EXISTS reaction_events (
    reaction_id UUID,
    session_id UUID,
    project_id String,
    experiment_id String,
    scene_id String,
    media_time_ms UInt32,
    reaction_type String, -- CONFUSED, ENGAGING
    idempotency_key String,
    created_at DateTime64(3, 'UTC') DEFAULT now64()
) ENGINE = MergeTree()
ORDER BY (project_id, scene_id, media_time_ms, reaction_type);

-- Query provenance and evidence records
CREATE TABLE IF NOT EXISTS evidence_records (
    evidence_id String,
    project_id String,
    experiment_id String,
    scene_id String,
    query_run_id String,
    observed_effect String,
    uncertainty_range String,
    time_window_start_ms UInt32,
    time_window_end_ms UInt32,
    sample_size UInt32,
    sql_query String,
    created_at DateTime64(3, 'UTC') DEFAULT now64()
) ENGINE = MergeTree()
ORDER BY (project_id, experiment_id, evidence_id);
