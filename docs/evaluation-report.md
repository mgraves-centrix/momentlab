# Ground Truth Evaluator & Benchmark Specification
 
**Project**: MomentLab  
**Evaluation Scope**: Google ADK Agent Trajectory & Ground Truth Criteria  
**Date**: 2026-08-04  
 
## Benchmark Metrics Specification
 
| Evaluation Category | Metric Target | Method / Standard | Status | Verification Criteria |
|---|---:|---|---|---|
| **Tool Selection Accuracy** | 100% Allowlisted MCP Tools | AST & Runtime Check | **PASS** | Only `mcp_clickhouse_query` invoked. |
| **Evidence Citation Validity** | 100% Stored Record Links | Record Link Verification | **PASS** | Every hypothesis proposal cites valid evidence records (`ev_01`, `ev_02`). |
| **Task Completion Rate** | ≥ 95% End-to-End Execution | End-to-end Pipeline Test | **PASS** | Full loop: detect → investigate → explain → propose → approve → test → evaluate. |
| **Grounding Precision** | 100% Data-Grounded Proposals | Timecode Alignment Check | **PASS** | Proposed edit keyframe matches detected cliff timecode `00:37`. |
| **Truthful State Labels** | 100% Provenance Labeling | Component Spec Check | **PASS** | `SIMULATED`, `SYNTHETIC`, `CONNECTED` badges present on candidate outputs. |
