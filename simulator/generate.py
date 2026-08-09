import random
import uuid
import time
import requests
import json
from datetime import datetime, timezone

# Assuming ClickHouse HTTP interface at localhost:8123
CLICKHOUSE_URL = "http://localhost:8123/"
RNG_SEED = 42

def setup_clickhouse():
    # Verify DB is up
    try:
        requests.get(CLICKHOUSE_URL)
    except Exception:
        print("ClickHouse not available at localhost:8123")
        return False
    return True

def generate_session(user_id, cohort):
    # Generates a series of events for a user
    events = []
    # simulate a 60 second video
    for second in range(0, 60):
        # Base engagement is high initially
        is_engaged = True
        sentiment = 'ENGAGING'

        # Introduce the cliff at 00:33 - 00:41
        if 33 <= second <= 41:
            if cohort == '18-24':
                # Higher drop-off for this cohort
                if random.random() < 0.6: 
                    sentiment = 'CONFUSING'
            else:
                if random.random() < 0.4:
                    sentiment = 'BORED'

        events.append({
            'event_id': str(uuid.uuid4()),
            'session_id': user_id,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'event_type': 'reaction',
            'video_time': second,
            'sentiment': sentiment,
            'cohort': cohort
        })
    return events

def run_simulation(num_sessions=1000):
    random.seed(RNG_SEED)
    if not setup_clickhouse():
        return
        
    print(f"Generating {num_sessions} screening sessions...")
    all_events = []
    cohorts = ['18-24', '25-34', '35-44', '45+']
    
    for _ in range(num_sessions):
        user_id = str(uuid.uuid4())
        cohort = random.choices(cohorts, weights=[40, 30, 20, 10])[0]
        events = generate_session(user_id, cohort)
        all_events.extend(events)
        
    # We would normally write to clickhouse here via HTTP batch
    # For now we'll write a subset just to simulate the write
    batch = all_events[:5000]
    
    # In a real implementation this would map exactly to the CH schema
    # e.g. INSERT INTO momentlab.playback_events FORMAT JSONEachRow
    
    # Since clickhouse is already setup with schema from Phase 2, we just hit the endpoint
    try:
        # Simplistic insert format for demonstration
        data = "\n".join([json.dumps({
            "session_id": e["session_id"],
            "video_time": e["video_time"],
            "event_type": e["event_type"],
            "metadata": e["sentiment"],
            "timestamp": e["timestamp"]
        }) for e in batch])
        
        resp = requests.post(
            CLICKHOUSE_URL, 
            params={"query": "INSERT INTO default.playback_events FORMAT JSONEachRow"},
            data=data
        )
        if resp.status_code == 200:
            print("Successfully seeded ClickHouse.")
        else:
            print(f"Failed to seed ClickHouse: {resp.text}")
    except Exception as e:
        print(f"Error seeding ClickHouse: {e}")

if __name__ == "__main__":
    run_simulation()
