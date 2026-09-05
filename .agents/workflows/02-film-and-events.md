# Workflow 02 — film and events

Goal: prove consented response signals align to canonical media time and reach ClickHouse.

1. Implement consent, screening token validation, owned or synthetic media provenance, player instrumentation, post-scene survey, and completion state.

2. Define OpenAPI/Pydantic event contracts, monotonic timestamps, canonical `media_time_ms`, idempotency keys, retry, and rate/size limits.
3. Add ClickHouse DDL, migration command, write-limited ingestion identity, batch writer, deterministic simulator, and hidden evaluation truth.
4. Wire the live player and timeline through typed APIs without changing the approved UI geometry.
5. Test consent denial, duplicate/reordered events, invalid tokens, unavailable media, tiny cohorts, and project isolation.

Exit gate: a reproducible integration test proves consented events reach ClickHouse exactly once and align to visible timecode; no simulated behavior is mislabeled.
