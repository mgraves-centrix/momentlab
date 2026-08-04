# Workflow 06 — GCP deployment and submission

Goal: deploy exactly the verified product and package judge-visible proof.

1. Provision least-privilege Google Cloud resources through idempotent Terraform and documented scripts; keep IDs configurable and secrets in Secret Manager.
2. Build/test in Cloud Build, publish to Artifact Registry, deploy web/API/MCP services as designed, and deploy the ADK agent to Agent Engine when supported.
3. Run smoke, authorization, MCP, approval, media, and clean-browser checks against the hosted URL.
4. Capture actual architecture/runtime evidence, final UI screenshots, and measured evaluation outputs.
5. Complete README, compliance matrix, judge proof, three-minute script, submission text, rollback, cleanup, and cost controls.
6. Before making the repository public, perform secret/license/provenance scans and obtain the owner’s explicit authorization.

Exit gate: hosted behavior matches the verified demo; every judging claim maps to a runtime artifact and demo timestamp; no secret, unlicensed asset, or unsupported success claim remains.
