-- MomentLab ClickHouse Data Retention & TTL Policies
-- Database: momentlab

USE momentlab;

-- 1. Automatically purge raw second-by-second audience events older than 90 days
-- Note: Aggregated quantiles in `retention_by_second_aggregated` remain intact permanently
ALTER TABLE audience_events
MODIFY TTL event_timestamp + INTERVAL 90 DAY;

-- 2. Purge raw explicit reaction events older than 90 days
ALTER TABLE reaction_events
MODIFY TTL created_at + INTERVAL 90 DAY;

-- 3. Retain screening session tokens for 180 days
ALTER TABLE screening_sessions
MODIFY TTL created_at + INTERVAL 180 DAY;
