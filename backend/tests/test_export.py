from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_export_edl_otio():
    response = client.get("/api/v1/scenes/sc_12/export-edl?format=otio")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"
    data = response.json()
    assert data["OTIO_SCHEMA"] == "Timeline.1"

def test_export_edl_fcpxml():
    response = client.get("/api/v1/scenes/sc_12/export-edl?format=fcpxml")
    assert response.status_code == 200
    assert "application/xml" in response.headers["content-type"]
    assert "<fcpxml" in response.text
