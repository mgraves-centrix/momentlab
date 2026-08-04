import hashlib
import uuid
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger("momentlab.approval")

class ApprovalGateService:
    """
    Enforces server-confirmed human approval before any A/B experiment launch.
    Maintains an immutable audit log.
    """
    def __init__(self):
        self._audit_records: List[Dict[str, Any]] = []
        self._approved_experiments: Dict[str, Dict[str, Any]] = {}

    def submit_approval(self, reviewer_id: str, experiment_id: str, hypothesis_id: str, consent_confirmed: bool) -> Dict[str, Any]:
        if not consent_confirmed:
            raise ValueError("Human authorization consent confirmation is required.")

        if not reviewer_id or len(reviewer_id.strip()) == 0:
            raise ValueError("Authorized reviewer identity is required.")

        approval_id = f"appr_{uuid.uuid4().hex[:12]}"
        timestamp = datetime.now(timezone.utc).isoformat()
        
        # Hash consent record for immutable audit proof
        consent_hash = hashlib.sha256(f"{reviewer_id}:{experiment_id}:{hypothesis_id}:{timestamp}".encode()).hexdigest()

        record = {
            "approval_id": approval_id,
            "reviewer_id": reviewer_id,
            "experiment_id": experiment_id,
            "hypothesis_id": hypothesis_id,
            "consent_hash": consent_hash,
            "timestamp": timestamp,
            "status": "APPROVED"
        }

        self._audit_records.append(record)
        self._approved_experiments[experiment_id] = record

        logger.info("Human Approval Recorded: %s by reviewer %s", approval_id, reviewer_id)
        return record

    def is_experiment_approved(self, experiment_id: str) -> bool:
        return experiment_id in self._approved_experiments

    def get_approval_audit_trail(self) -> List[Dict[str, Any]]:
        return self._audit_records
