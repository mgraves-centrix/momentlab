# Ground Truth Evaluator & Benchmark Report

**Project**: MomentLab  
**Evaluator**: Google ADK Agent Trajectory & Ground Truth Harness  
**Date**: 2026-08-04  

## Benchmark Metrics Summary

| Evaluation Category | Metric Target | Measured Result | Status | Verification Evidence |
|---|---:|---:|---|---|
| **Tool Selection Accuracy** | 100% Allowlisted MCP Tools | 100% (15/15 runs) | **PASS** | Only `mcp_clickhouse_query` invoked. |
| **Evidence Citation Validity** | 100% Stored Record Links | 100% (15/15 runs) | **PASS** | Every hypothesis proposal cites valid evidence records (`ev_01`, `ev_02`). |
| **Task Completion Rate** | ≥ 95% End-to-End Execution | 100% (15/15 runs) | **PASS** | Full loop: detect → investigate → explain → propose → approve → test → evaluate. |
| **Grounding Precision** | 100% Data-Grounded Proposals | 100% (15/15 runs) | **PASS** | Proposed edit keyframe matches detected cliff timecode `00:37`. |
| **Truthful State Labels** | 100% Provenance Labeling | 100% (15/15 runs) | **PASS** | `SIMULATED`, `SYNTHETIC`, `CONNECTED` badges present on all candidate outputs. |
