import uuid
import random
from typing import List, Dict, Any

def generate_northlight_simulated_events(count: int = 100) -> List[Dict[str, Any]]:
    """
    Generates deterministic audience playback events matching the Northlight Scene 12 profile:
    - Cliff at 00:37 (37000ms) with -28% retention drop.
    """
    random.seed(42)  # Deterministic seed
    events = []
    
    for i in range(count):
        session_id = str(uuid.UUID(int=i + 1))
        
        # Timepoints: 0s, 10s, 20s, 30s, 33s, 37s, 41s, 50s, 60s
        timepoints = [
            (0, 85.0),
            (10000, 84.0),
            (20000, 81.0),
            (30000, 78.0),
            (33000, 75.0),
            (37000, 50.0),  # Cliff
            (41000, 53.0),
            (50000, 62.0),
            (60000, 70.0)
        ]
        
        for time_ms, base_retention in timepoints:
            # Add small noise (+/- 2.0%)
            noise = random.uniform(-2.0, 2.0)
            score = max(0.0, min(100.0, base_retention + noise))
            
            events.append({
                "event_id": str(uuid.uuid4()),
                "session_id": session_id,
                "project_id": "proj_northlight_01",
                "experiment_id": "exp_23a",
                "scene_id": "sc_12",
                "media_time_ms": time_ms,
                "retention_score": round(score, 2),
                "playback_state": "PLAYING",
                "idempotency_key": f"nl_{session_id}_{time_ms}"
            })
            
    return events
