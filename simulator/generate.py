import random
import uuid
import time
import requests
import json
from datetime import datetime, timezone, timedelta
import os

CLICKHOUSE_URL = f"http://localhost:{os.environ.get('CLICKHOUSE_PORT', '8123')}/"
RNG_SEED = 42
PROJECT_ID = "proj_northlight_01"
EXPERIMENT_ID = "exp_23a"
SCENE_ID = "scene12"

def setup_clickhouse():
    try:
        requests.get(CLICKHOUSE_URL)
    except Exception:
        print(f"ClickHouse not available at {CLICKHOUSE_URL}")
        return False
    return True

def generate_session(session_id, cohort, base_time):
    # session
    session = {
        'session_id': session_id,
        'screening_token': f"token_{session_id[:8]}",
        'project_id': PROJECT_ID,
        'experiment_id': EXPERIMENT_ID,
        'scene_id': SCENE_ID,
        'respondent_cohort': cohort,
        'consent_given': 1,
        'consent_timestamp': (base_time - timedelta(minutes=1)).strftime('%Y-%m-%d %H:%M:%S.000'),
        'created_at': base_time.strftime('%Y-%m-%d %H:%M:%S.000')
    }

    audience = []
    reactions = []
    
    # simulate a 60 second video (60000 ms)
    # The mockup shows a drop off specifically around 00:31 - 00:41 for ALL, mostly driven by 18-24 and 25-34
    for second in range(0, 60):
        media_time_ms = second * 1000
        event_time = base_time + timedelta(seconds=second)
        event_time_str = event_time.strftime('%Y-%m-%d %H:%M:%S.000')
        
        # retention score starts at 1.0, degrades slightly, but sharp drop in 31-41
        retention = 1.0 - (second * 0.002)
        if 31 <= second <= 41:
            if cohort == '18-24':
                retention -= 0.35 # Sharp drop
            elif cohort == '25-34':
                retention -= 0.20
            else:
                retention -= 0.05
        
        # Add noise
        retention += random.uniform(-0.05, 0.05)
        retention = max(0.0, min(1.0, retention))
        
        audience.append({
            'event_id': str(uuid.uuid4()),
            'session_id': session_id,
            'project_id': PROJECT_ID,
            'experiment_id': EXPERIMENT_ID,
            'scene_id': SCENE_ID,
            'media_time_ms': media_time_ms,
            'retention_score': round(retention, 4),
            'playback_state': 'PLAYING',
            'idempotency_key': str(uuid.uuid4()),
            'event_timestamp': event_time_str
        })
        
        # Generate reactions
        reaction_type = None
        if 31 <= second <= 41:
            if cohort == '18-24' and random.random() < 0.4:
                reaction_type = 'CONFUSED'
            elif cohort == '25-34' and random.random() < 0.2:
                reaction_type = 'BORED'
        elif random.random() < 0.05:
            reaction_type = 'ENGAGING'
            
        if reaction_type:
            reactions.append({
                'reaction_id': str(uuid.uuid4()),
                'session_id': session_id,
                'project_id': PROJECT_ID,
                'experiment_id': EXPERIMENT_ID,
                'scene_id': SCENE_ID,
                'media_time_ms': media_time_ms,
                'reaction_type': reaction_type,
                'idempotency_key': str(uuid.uuid4()),
                'created_at': event_time_str
            })
            
    return session, audience, reactions

def insert_batch(table, data):
    if not data: return
    ndjson = "\n".join([json.dumps(row) for row in data])
    resp = requests.post(
        CLICKHOUSE_URL,
        auth=(os.environ.get("CLICKHOUSE_WRITER_USER", "momentlab_writer"), os.environ.get("CLICKHOUSE_WRITER_PASSWORD", "")),
        params={"query": f"INSERT INTO momentlab.{table} FORMAT JSONEachRow"},
        data=ndjson
    )
    if resp.status_code != 200:
        print(f"Failed to insert into {table}: {resp.text}")

def run_simulation(num_sessions=1000):
    random.seed(RNG_SEED)
    if not setup_clickhouse():
        return
        
    print(f"Generating {num_sessions} screening sessions...")
    cohorts = ['18-24', '25-34', '35-44', '45+']
    base_time = datetime.now(timezone.utc) - timedelta(days=2)
    
    sessions_data = []
    audience_data = []
    reactions_data = []
    
    for i in range(num_sessions):
        user_id = str(uuid.uuid4())
        cohort = random.choices(cohorts, weights=[40, 30, 20, 10])[0]
        s, a, r = generate_session(user_id, cohort, base_time + timedelta(minutes=i))
        sessions_data.append(s)
        audience_data.extend(a)
        reactions_data.extend(r)
        
        # Batch insert
        if len(sessions_data) >= 500:
            insert_batch('screening_sessions', sessions_data)
            insert_batch('audience_events', audience_data)
            insert_batch('reaction_events', reactions_data)
            sessions_data, audience_data, reactions_data = [], [], []
            print(f"Inserted up to session {i+1}")
            
    if sessions_data:
        insert_batch('screening_sessions', sessions_data)
        insert_batch('audience_events', audience_data)
        insert_batch('reaction_events', reactions_data)

    print("Successfully seeded ClickHouse.")

if __name__ == "__main__":
    run_simulation()
