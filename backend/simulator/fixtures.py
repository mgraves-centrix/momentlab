import uuid
import random
import math
from typing import List, Dict, Any, Tuple
from datetime import datetime, timezone

def generate_northlight_simulated_events(count: int = 525) -> List[Dict[str, Any]]:
    events, _ = generate_northlight_events_and_sessions(count=count)
    return events

def generate_northlight_events_and_sessions(count: int = 525) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Generates deterministic second-by-second audience playback events and screening sessions
    matching the Northlight Scene 12 profile:
    - 61 seconds (00:00 to 01:00) with 1000ms intervals across respondents.
    - Cohort distributions:
      * 18_24: baseline starts ~88.5%, drops sharply to ~43.2% at 00:37 (-45.3% cliff), recovers to ~64%
      * 25_34: baseline starts ~84.1%, drops moderately to ~51.8% at 00:37 (-32.3% cliff), recovers to ~71.5%
      * 35_44: baseline starts ~82.0%, drops gently to ~59.0% at 00:37 (-23.0% cliff), recovers to ~76%
      * 45_plus: baseline starts ~79.5%, drops slightly to ~65.0% at 00:37 (-14.5% cliff), recovers to ~78.5%
      * all: combined average starts at ~85.25%, drops to ~50% at 00:37, recovers to ~70%
    """
    random.seed(42)  # Deterministic seed for reproducible testing
    events = []
    sessions = []
    
    timepoints_ms = [i * 1000 for i in range(61)]
    
    def get_base_retention(t_ms: int, cohort: str) -> float:
        t_sec = t_ms / 1000.0
        if cohort == "18_24":
            start_val, cliff_val, end_val = 88.5, 43.2, 64.0
        elif cohort == "25_34":
            start_val, cliff_val, end_val = 84.1, 51.8, 71.5
        elif cohort == "35_44":
            start_val, cliff_val, end_val = 82.0, 59.0, 76.0
        else: # 45_plus
            start_val, cliff_val, end_val = 79.5, 65.0, 78.5
            
        mid_pre = start_val - (start_val - 78.0) * 0.5 if start_val > 78 else start_val - 2.0
        if t_sec < 30:
            return start_val - ((start_val - mid_pre) * (t_sec / 30.0))
        elif 30 <= t_sec < 33:
            return mid_pre - (2.0 * ((t_sec - 30.0) / 3.0))
        elif 33 <= t_sec <= 37:
            pre_cliff = mid_pre - 2.0
            progress = (t_sec - 33.0) / 4.0
            return pre_cliff - ((pre_cliff - cliff_val) * progress)
        elif 37 < t_sec <= 41:
            progress = (t_sec - 37.0) / 4.0
            return cliff_val + (3.0 * progress)
        else:
            valley = cliff_val + 3.0
            progress = (t_sec - 41.0) / 19.0
            return valley + ((end_val - valley) * progress)

    cohorts = ["18_24", "25_34", "35_44", "45_plus"]
    cohort_weights = [0.35, 0.45, 0.15, 0.05]

    for i in range(count):
        session_id = str(uuid.UUID(int=i + 1))
        r_val = (i % 100) / 100.0
        if r_val < cohort_weights[0]:
            cohort = cohorts[0]
        elif r_val < cohort_weights[0] + cohort_weights[1]:
            cohort = cohorts[1]
        elif r_val < cohort_weights[0] + cohort_weights[1] + cohort_weights[2]:
            cohort = cohorts[2]
        else:
            cohort = cohorts[3]

        sessions.append({
            "session_id": session_id,
            "screening_token": f"tok_{session_id[:8]}",
            "project_id": "proj_northlight_01",
            "experiment_id": "exp_23a",
            "scene_id": "sc_12",
            "respondent_cohort": cohort,
            "consent_given": 1,
            "consent_timestamp": datetime.now(timezone.utc),
            "created_at": datetime.now(timezone.utc)
        })

        # Determine respondent drop-off likelihood
        dropped_out = False
        drop_time = 60000
        if (i % 7) == 0:  # ~14% drop out during cliff
            drop_time = random.randint(35000, 42000)
            dropped_out = True

        for time_ms in timepoints_ms:
            if dropped_out and time_ms > drop_time:
                break
                
            base = get_base_retention(time_ms, cohort)
            noise = math.sin(i * 0.7 + time_ms * 0.001) * 1.2
            score = max(0.0, min(100.0, base + noise))
            
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
            
    return events, sessions
