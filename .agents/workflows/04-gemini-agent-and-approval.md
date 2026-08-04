# Workflow 04 — Gemini agent and approval

Goal: turn bounded evidence into one falsifiable proposal while a human retains control.

1. Implement deterministic anomaly detection and typed evidence retrieval before model interpretation.
2. Implement the bounded Google ADK flow: investigate, gather evidence, request Gemini explanation, validate schema/citations, and propose one experiment draft.
3. Treat transcript and survey content as untrusted data; prevent it from changing system policy or tools.
4. Implement hypothesis, evidence, limitations, confidence calibration, and simulated forecast UI states.
5. Enforce authenticated reviewer authorization, explicit approval, CSRF protection where applicable, idempotency, immutable audit, and legal state transitions server-side.
6. Test invalid citations, contradictory evidence, injection, approval bypass, replay, concurrent approval, and cancellation.

Exit gate: the proposal is schema-valid and evidence-backed; no launch path succeeds without server-confirmed authorized approval.
