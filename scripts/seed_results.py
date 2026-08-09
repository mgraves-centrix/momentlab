import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.db import get_db

def seed_results():
    db = get_db()
    if not db:
        print("Failed to connect to Firestore.")
        return

    project_id = "proj_northlight_01"
    experiment_id = "exp_23a"
    
    results_ref = db.collection('projects').document(project_id).collection('experiments').document(experiment_id).collection('results').document('current')
    
    data = {
        "hypothesis": "MOVE REVEAL 6S EARLIER",
        "outcome": "SUPPORTED",
        "outcome_details": "Statistically significant lift detected",
        "confidence": 91,
        "test_period_start": "2025-05-19",
        "test_period_end": "2025-05-26",
        "test_duration_days": 7,
        "sample_size_control": 2366,
        "sample_size_variant": 2366,
        
        "cohort_breakdown": [
            {"cohort": "ALL", "cut_a": 55, "cut_b": 65, "lift": 18, "ci": "[+12%, +24%]", "confidence": 91},
            {"cohort": "18–24", "cut_a": 58, "cut_b": 69, "lift": 19, "ci": "[+10%, +28%]", "confidence": 87},
            {"cohort": "25–34", "cut_a": 53, "cut_b": 63, "lift": 19, "ci": "[+11%, +27%]", "confidence": 90}
        ],
        
        "engagement_over_time": [
            {"time": "00:00", "cut_a": 85, "cut_b": 85},
            {"time": "00:20", "cut_a": 80, "cut_b": 81},
            {"time": "00:40", "cut_a": 70, "cut_b": 72},
            {"time": "01:00", "cut_a": 55, "cut_b": 65},
            {"time": "01:20", "cut_a": 50, "cut_b": 60},
            {"time": "01:40", "cut_a": 48, "cut_b": 58},
            {"time": "02:00", "cut_a": 45, "cut_b": 55},
            {"time": "02:18", "cut_a": 43, "cut_b": 53}
        ],
        
        "engagement_lift_distribution": [
            {"bucket": "-40%", "value": 0},
            {"bucket": "-30%", "value": 2},
            {"bucket": "-20%", "value": 5},
            {"bucket": "-10%", "value": 15},
            {"bucket": "0%", "value": 30},
            {"bucket": "+10%", "value": 80},
            {"bucket": "+18%", "value": 100},
            {"bucket": "+30%", "value": 40},
            {"bucket": "+40%", "value": 10},
            {"bucket": "+50%", "value": 2},
            {"bucket": "+60%", "value": 0}
        ],
        
        "key_results": {
            "primary": {
                "metric": "Engagement Lift",
                "value": "+18%",
                "ci": "[+12%, +24%]"
            },
            "secondary": {
                "metric": "Completion Lift",
                "value": "+9%",
                "ci": "[+4%, +14%]"
            },
            "guardrail": {
                "metric": "Confused Change",
                "value": "-4%",
                "ci": "[-8%, 0%]"
            }
        },
        "metadata": {
            "analysis_id": "ANL-23A-RESULTS-01",
            "dataset_snapshot": "SNAP-2025-05-26T23:59:59Z",
            "query_bundle_id": "QRY-23A-001"
        }
    }
    
    results_ref.set(data)
    print(f"Successfully seeded results for project {project_id}, experiment {experiment_id}.")

if __name__ == "__main__":
    seed_results()
