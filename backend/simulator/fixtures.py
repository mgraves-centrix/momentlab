import uuid
import random
import math
from typing import List, Dict, Any

def generate_northlight_simulated_events(count: int = 525) -> List[Dict[str, Any]]:
    """
    Generates deterministic second-by-second audience playback events matching the Northlight Scene 12 profile:
    - 61 seconds (00:00 to 01:00) with 1000ms intervals across 525 respondents.
    - Baseline gradual decline from 85% at 00:00 to 78% at 00:30.
    - Sharp response cliff beginning at 00:33, reaching lowest inflection point at 00:37 (50%, -28% drop), continuing to 00:41.
    - Recovery after 00:42 back toward 70%.
    """
    random.seed(42)  # Deterministic seed for reproducible testing
    events = []
    
    # 61 time points (0 to 60000 ms by 1000ms)
    timepoints_ms = [i * 1000 for i in range(61)]
    
    def get_base_retention(t_ms: int) -> float:
        t_sec = t_ms / 1000.0
        if t_sec < 30:
            # Gentle drift from 85.0 down to 78.0
            return 85.0 - (7.0 * (t_sec / 30.0))
        elif 30 <= t_sec < 33:
            # 78.0 to 75.0
            return 78.0 - (3.0 * ((t_sec - 30.0) / 3.0))
        elif 33 <= t_sec <= 37:
            # Steep cliff down to 50.0 at 37s (Drop of -28% from peak 78%)
            progress = (t_sec - 33.0) / 4.0
            return 75.0 - (25.0 * progress)
        elif 37 < t_sec <= 41:
            # Valley around 50.0 to 53.0
            progress = (t_sec - 37.0) / 4.0
            return 50.0 + (3.0 * progress)
        else:
            # Post-anomaly gradual rise from 53.0 to 70.0 at 60s
            progress = (t_sec - 41.0) / 19.0
            return 53.0 + (17.0 * progress)

    cohorts = ["18-24", "25-34", "35+"]
    cohort_weights = [0.35, 0.45, 0.20]

    for i in range(count):
        session_id = str(uuid.UUID(int=i + 1))
        # Assign deterministic cohort
        r_val = (i % 100) / 100.0
        if r_val < cohort_weights[0]:
            cohort = cohorts[0]
            cohort_offset = -2.0  # 18-24 slightly steeper drop
        elif r_val < cohort_weights[0] + cohort_weights[1]:
            cohort = cohorts[1]
            cohort_offset = 1.0   # 25-34 average
        else:
            cohort = cohorts[2]
            cohort_offset = 3.0   # 35+ slightly higher
        
        # Determine respondent drop-off likelihood
        dropped_out = False
        drop_time = 60000
        if (i % 7) == 0:  # ~14% drop out during cliff
            drop_time = random.randint(35000, 42000)
            dropped_out = True

        for time_ms in timepoints_ms:
            if dropped_out and time_ms > drop_time:
                break
                
            base = get_base_retention(time_ms) + cohort_offset
            # Add subtle deterministic noise (+/- 1.5%)
            noise = math.sin(i * 0.7 + time_ms * 0.001) * 1.5
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
            
    return events
