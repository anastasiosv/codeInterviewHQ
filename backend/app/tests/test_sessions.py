import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture(scope="module")
def test_client():
    return client


def test_create_session(test_client):
    response = test_client.post("/api/sessions", json={"id": "test-session-1"})
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "test-session-1"
    assert "code" in data
    assert data["language"] == "javascript"

def test_get_existing_session(test_client):
    # Ensure session exists
    test_client.post("/api/sessions", json={"id": "test-session-2"})
    response = test_client.get("/api/sessions/test-session-2")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "test-session-2"
    assert "code" in data
    assert data["language"] == "javascript"

def test_get_nonexistent_session(test_client):
    response = test_client.get("/api/sessions/nonexistent")
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Session not found"
