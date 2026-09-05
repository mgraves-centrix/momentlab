-- MomentLab ClickHouse Materialized Views DDL
-- Database: momentlab

USE momentlab;

-- 1. Real-time Second-by-Second Quantile Retention Aggregation View
CREATE TABLE IF NOT EXISTS retention_by_second_aggregated (
    project_id String,
    experiment_id String,
    scene_id String,
    respondent_cohort String,
    media_time_ms UInt32,
    sample_size SimpleAggregateFunction(sum, UInt64),
    retention_avg AggregateFunction(avg, Float32),
    retention_median AggregateFunction(quantile(0.5), Float32),
    retention_p10 AggregateFunction(quantile(0.1), Float32),
    retention_p90 AggregateFunction(quantile(0.9), Float32)
) ENGINE = AggregatingMergeTree()
ORDER BY (project_id, scene_id, experiment_id, respondent_cohort, media_time_ms);

CREATE MATERIALIZED VIEW IF NOT EXISTS retention_by_second_mv TO retention_by_second_aggregated AS
SELECT
    project_id,
    experiment_id,
    scene_id,
    'ALL' AS respondent_cohort,
    media_time_ms,
    count() AS sample_size,
    avgState(retention_score) AS retention_avg,
    quantileState(0.5)(retention_score) AS retention_median,
    quantileState(0.1)(retention_score) AS retention_p10,
    quantileState(0.9)(retention_score) AS retention_p90
FROM audience_events
GROUP BY project_id, experiment_id, scene_id, media_time_ms;

-- 2. Real-time Explicit Reaction Anomaly Aggregation View
CREATE TABLE IF NOT EXISTS reaction_anomalies_aggregated (
    project_id String,
    scene_id String,
    media_time_ms UInt32,
    confused_count SimpleAggregateFunction(sum, UInt64),
    engaging_count SimpleAggregateFunction(sum, UInt64),
    bored_count SimpleAggregateFunction(sum, UInt64)
) ENGINE = SummingMergeTree()
ORDER BY (project_id, scene_id, media_time_ms);

CREATE MATERIALIZED VIEW IF NOT EXISTS reaction_anomalies_mv TO reaction_anomalies_aggregated AS
SELECT
    project_id,
    scene_id,
    media_time_ms,
    countIf(reaction_type = 'CONFUSED') AS confused_count,
    countIf(reaction_type = 'ENGAGING') AS engaging_count,
    countIf(reaction_type = 'BORED') AS bored_count
FROM reaction_events
GROUP BY project_id, scene_id, media_time_ms;
