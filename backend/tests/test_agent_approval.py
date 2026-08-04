import pytest
from backend.agent.adk_runner import GoogleAdkAgentRunner
from backend.agent.approval_service import ApprovalGateService

def test_google_adk_agent_investigation():
    runner = GoogleAdkAgentRunner()
    proposal = runner.run_investigation(project_id="proj_northlight_01", scene_id="sc_12")

    assert proposal["hypothesis_id"] == "hyp_23a"
    assert proposal["proposed_change"] == "MOVE REVEAL 6S EARLIER"
    assert proposal["confidence_score"] == 91
    assert proposal["is_simulated"] is True
    assert len(proposal["evidence_citations"]) >= 2
    assert "mcp_telemetry" in proposal

def test_server_approval_gate_enforcement():
    service = ApprovalGateService()
    
    # Test rejection when consent not checked
    with pytest.raises(ValueError, match="Human authorization consent confirmation is required"):
        service.submit_approval(
            reviewer_id="editor_lead_01",
            experiment_id="exp_23a",
            hypothesis_id="hyp_23a",
            consent_confirmed=False
        )

    # Test rejection when reviewer_id is empty
    with pytest.raises(ValueError, match="Authorized reviewer identity is required"):
        service.submit_approval(
            reviewer_id="",
            experiment_id="exp_23a",
            hypothesis_id="hyp_23a",
            consent_confirmed=True
        )

    # Successful approval
    record = service.submit_approval(
        reviewer_id="editor_lead_01",
        experiment_id="exp_23a",
        hypothesis_id="hyp_23a",
        consent_confirmed=True
    )

    assert record["status"] == "APPROVED"
    assert record["reviewer_id"] == "editor_lead_01"
    assert len(record["consent_hash"]) == 64
    assert service.is_experiment_approved("exp_23a") is True
