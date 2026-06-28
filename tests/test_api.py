from fastapi.testclient import TestClient

from backend.data.demo_data import MIDDLE_SCHOOLS
from backend.main import app

client = TestClient(app)


def test_health_and_districts():
    assert client.get("/api/health").status_code == 200
    assert len(client.get("/api/districts").json()["districts"]) == 16


def test_recommendation_endpoint():
    middle = next(item for item in MIDDLE_SCHOOLS if item["district"] == "杨浦区")
    response = client.post("/api/recommendations", json={"district": "杨浦区", "middle_school_id": middle["id"], "score": 690})
    assert response.status_code == 200
    assert response.json()["schools"]


def test_invalid_score_is_rejected():
    middle = MIDDLE_SCHOOLS[0]
    response = client.post("/api/recommendations", json={"district": middle["district"], "middle_school_id": middle["id"], "score": 800})
    assert response.status_code == 422
