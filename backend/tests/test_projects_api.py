from unittest.mock import patch
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

PROJECT = {"id": 1, "name": "Summer Dress", "notes": "", "status": "active", "created_at": "2026-01-01"}
ITEM = {"id": 1, "project_id": 1, "name": "Cotton fabric", "quantity": "2m", "checked": 0, "created_at": "2026-01-01"}
PATTERN = {"id": 1, "project_id": 1, "title": "Simplicity 9898", "url": "https://simplicity.com/9898", "snippet": "Easy dress", "saved_at": "2026-01-01"}


# --- Projects ---

def test_list_projects():
    with patch("api.projects.project_service.list_projects", return_value=[PROJECT]):
        resp = client.get("/api/projects/")
    assert resp.status_code == 200
    assert resp.json()[0]["name"] == "Summer Dress"


def test_create_project():
    with patch("api.projects.project_service.create_project", return_value={"id": 1, "name": "Summer Dress"}):
        resp = client.post("/api/projects/", json={"name": "Summer Dress", "notes": ""})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Summer Dress"


def test_create_project_missing_name():
    resp = client.post("/api/projects/", json={})
    assert resp.status_code == 422


def test_delete_project():
    with patch("api.projects.project_service.delete_project"):
        resp = client.delete("/api/projects/1")
    assert resp.status_code == 200
    assert resp.json()["deleted"] == 1


# --- Checklist ---

def test_get_checklist():
    with patch("api.projects.project_service.get_checklist", return_value=[ITEM]):
        resp = client.get("/api/projects/1/checklist")
    assert resp.status_code == 200
    assert resp.json()[0]["name"] == "Cotton fabric"


def test_add_checklist_item():
    with patch("api.projects.project_service.add_checklist_item", return_value={"id": 1, "name": "Cotton fabric"}):
        resp = client.post("/api/projects/1/checklist", json={"name": "Cotton fabric", "quantity": "2m"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Cotton fabric"


def test_add_checklist_item_missing_name():
    resp = client.post("/api/projects/1/checklist", json={})
    assert resp.status_code == 422


def test_toggle_checklist_item():
    checked_item = {**ITEM, "checked": 1}
    with patch("api.projects.project_service.toggle_checklist_item", return_value=checked_item):
        resp = client.patch("/api/projects/1/checklist/1/toggle")
    assert resp.status_code == 200
    assert resp.json()["checked"] == 1


def test_toggle_checklist_item_not_found():
    with patch("api.projects.project_service.toggle_checklist_item", return_value=None):
        resp = client.patch("/api/projects/1/checklist/999/toggle")
    assert resp.status_code == 404


def test_delete_checklist_item():
    with patch("api.projects.project_service.delete_checklist_item"):
        resp = client.delete("/api/projects/1/checklist/1")
    assert resp.status_code == 200
    assert resp.json()["deleted"] == 1


# --- Saved patterns ---

def test_get_saved_patterns():
    with patch("api.projects.project_service.get_saved_patterns", return_value=[PATTERN]):
        resp = client.get("/api/projects/1/patterns")
    assert resp.status_code == 200
    assert resp.json()[0]["title"] == "Simplicity 9898"


def test_save_pattern():
    with patch("api.projects.project_service.save_pattern", return_value={"id": 1, "url": "https://simplicity.com/9898"}):
        resp = client.post("/api/projects/1/patterns", json={
            "title": "Simplicity 9898",
            "url": "https://simplicity.com/9898",
            "snippet": "Easy dress",
        })
    assert resp.status_code == 200
    assert resp.json()["url"] == "https://simplicity.com/9898"


def test_save_pattern_missing_url():
    resp = client.post("/api/projects/1/patterns", json={"title": "No URL"})
    assert resp.status_code == 422


def test_delete_saved_pattern():
    with patch("api.projects.project_service.delete_saved_pattern"):
        resp = client.delete("/api/projects/1/patterns/1")
    assert resp.status_code == 200
    assert resp.json()["deleted"] == 1
