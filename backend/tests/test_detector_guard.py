import pytest
from backend.services.detector import run_anomaly_detector

def test_detector_ignores_low_sample_outlier_buckets(monkeypatch):
    """
    Regression test for 3a: A single stray event with low sample size (e.g. sample_size=1 at 1000ms)
    must be ignored by run_anomaly_detector so it correctly identifies the true anomaly cliff (37000ms, 00:37).
    """
    # Mock ClickHouse client and query results
    class MockResult:
        def __init__(self, result_rows):
            self.result_rows = result_rows

    class MockClickHouseClient:
        def query(self, sql, parameters=None):
            if "count(DISTINCT session_id)" in sql:
                return MockResult([[35240]])
            if "retention_by_second_aggregated" in sql:
                # Include a synthetic low-sample bucket (1000ms, avg 0.0, sample_size 1)
                # and normal high-sample buckets (~35,000 samples) with true cliff at 37000ms (00:37)
                rows = [
                    (0, 100.0, 35240),
                    (1000, 0.0, 1),       # Stray single event outlier - MUST BE IGNORED by guard
                    (5000, 98.0, 35000),
                    (10000, 97.0, 35000),
                    (15000, 96.0, 35000),
                    (20000, 95.0, 35000),
                    (25000, 94.0, 35000),
                    (30000, 93.0, 35000),
                    (37000, 70.0, 35000),  # True anomaly cliff at 37000ms (00:37)
                    (40000, 72.0, 35000),
                    (45000, 73.0, 35000),
                ]
                return MockResult(rows)
            return MockResult([])

    monkeypatch.setattr("backend.services.detector.get_client", lambda: MockClickHouseClient())
    monkeypatch.setattr("backend.services.detector.get_db_name", lambda: "momentlab_test")

    res = run_anomaly_detector("proj_northlight_01", "exp_23a")

    # Verify detector ignored the single event bucket at 1000ms (00:01)
    # and correctly identified the true cliff at 37000ms (00:37)
    assert res["sampleSize"] == 35240
    assert res["detectedMoment"] == "00:37"
    assert res["detectedMomentMs"] == 37000
    assert res["retentionDrop"] == "-18.8%"
    assert res["anomalyWindow"] == "00:33–00:41"
