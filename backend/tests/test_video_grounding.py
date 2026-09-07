import pytest
from backend.agents.mcp_client import _perform_video_grounding, generate_hypothesis, _derive_grounding_window
from backend.routers.projects import PROJECT_MEDIA

def test_project_media_gcs_mapping():
    """Verifies B1: PROJECT_MEDIA registry exists and maps canonical demo projects."""
    assert "proj_northlight_01" in PROJECT_MEDIA
    assert PROJECT_MEDIA["proj_northlight_01"]["video_url"] == "/frames/northlight/scene.mp4"
    assert "proj_echoes_02" in PROJECT_MEDIA
    assert PROJECT_MEDIA["proj_echoes_02"]["video_url"] == "/frames/echoes_of_salt/scene.mp4"
    assert "proj_below_03" in PROJECT_MEDIA
    assert PROJECT_MEDIA["proj_below_03"]["video_url"] == "/frames/below_the_surface/scene.mp4"


def test_derive_grounding_window_parsing():
    """Verifies P31: _derive_grounding_window correctly parses timecodes and window strings."""
    # "00:33-00:41" -> ("30s", "44s")
    assert _derive_grounding_window({"evidenceRecords": [{"window": "00:33-00:41"}]}) == ("30s", "44s")
    assert _derive_grounding_window("00:33-00:41") == ("30s", "44s")

    # "00:33" -> ("30s", "44s")
    assert _derive_grounding_window({"evidenceRecords": [{"timestamp": "00:33"}]}) == ("30s", "44s")
    assert _derive_grounding_window("00:33") == ("30s", "44s")

    # "33-41" -> ("30s", "44s")
    assert _derive_grounding_window({"evidenceRecords": [{"window": "33-41"}]}) == ("30s", "44s")
    assert _derive_grounding_window("33-41") == ("30s", "44s")

    # En dash separator U+2013: "00:33–00:41" -> ("30s", "44s")
    assert _derive_grounding_window("00:33–00:41") == ("30s", "44s")

    # "01:05" -> start 62s, correctly clamped at scene end (65s)
    assert _derive_grounding_window({"evidenceRecords": [{"window": "01:05"}]}) == ("62s", "65s")
    assert _derive_grounding_window("01:05") == ("62s", "65s")

    # "00:02" -> start clamped to "0s", not negative
    assert _derive_grounding_window({"evidenceRecords": [{"window": "00:02"}]}) == ("0s", "13s")
    assert _derive_grounding_window("00:02") == ("0s", "13s")

    # "" / None -> default window ("30s", "44s")
    assert _derive_grounding_window("") == ("30s", "44s")
    assert _derive_grounding_window(None) == ("30s", "44s")
    assert _derive_grounding_window({"evidenceRecords": []}) == ("30s", "44s")

    # inverted range -> default window ("30s", "44s")
    assert _derive_grounding_window({"evidenceRecords": [{"window": "00:41-00:33"}]}) == ("30s", "44s")
    assert _derive_grounding_window("00:41-00:33") == ("30s", "44s")
    assert _derive_grounding_window("41-33") == ("30s", "44s")

    # HH:MM:SS test: "00:00:33-00:00:41" -> ("30s", "44s")
    assert _derive_grounding_window("00:00:33-00:00:41") == ("30s", "44s")


def test_video_grounding_fails_open_on_nonexistent_project():
    """Verifies B2: Grounding fails open (returns None) safely when project media is unknown."""
    res = _perform_video_grounding("proj_unknown_999", {"evidenceRecords": []})
    assert res is None


def test_video_grounding_fails_open_on_error(monkeypatch):
    """Verifies B2: Grounding fails open (returns None) safely on GCS / Vertex AI error."""
    def _mock_raise(*args, **kwargs):
        raise RuntimeError("Simulated Vertex AI permission or missing blob error")

    monkeypatch.setattr("google.genai.Client", _mock_raise)
    res = _perform_video_grounding("proj_northlight_01", {"evidenceRecords": [{"window": "00:33-00:41"}]})
    assert res is None


@pytest.mark.anyio
async def test_agent_hypothesis_succeeds_even_when_grounding_fails(monkeypatch):
    """Verifies B2 requirement: If grounding fails, hypothesis returns ClickHouse result intact."""
    def _mock_fail(*args, **kwargs):
        return None

    monkeypatch.setattr("backend.agents.mcp_client._perform_video_grounding", _mock_fail)
    hyp = await generate_hypothesis("proj_northlight_01", "exp_23a")
    assert hyp["status"] == "PROPOSED"
    assert "proposedChange" in hyp
    assert hyp.get("visualGrounding") is None
    assert len(hyp.get("evidenceRecords", [])) > 0

