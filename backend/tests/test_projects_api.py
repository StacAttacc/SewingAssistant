from unittest.mock import patch
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# --- Fixtures ---

PROJECT = {
    "id": 1, "name": "Summer Dress", "description": "A light summer dress",
    "budget": 80.0, "status": "active", "created_at": "2026-01-01",
}
CHECKLIST_ITEM = {
    "id": 1, "project_id": 1, "title": "Cut fabric pieces",
    "notes": "Use sharp scissors", "checked": 0, "created_at": "2026-01-01",
}
PATTERN = {
    "id": 1, "project_id": 1, "source": "simplicity",
    "title": "Simplicity 9898", "url": "https://simplicity.com/9898",
    "image_url": "https://simplicity.com/9898.jpg", "price": "$14.99",
    "saved_at": "2026-01-01",
}
MATERIAL = {
    "id": 1, "project_id": 1, "name": "Cotton fabric",
    "quantity": "2m", "notes": "Light blue", "purchased": 0,
    "created_at": "2026-01-01",
}
PROJECT_DETAIL = {
    **PROJECT,
    "patterns": [PATTERN],
    "materials": [MATERIAL],
    "checklist": [CHECKLIST_ITEM],
}


# --- Projects ---

def test_list_projects():
    with patch("api.projects.project_service.list_projects", return_value=[PROJECT]):
        resp = client.get("/api/projects/")
    assert resp.status_code == 200
    assert resp.json()[0]["name"] == "Summer Dress"


def test_get_project_detail():
    with patch("api.projects.project_service.get_project", return_value=PROJECT), \
         patch("api.projects.project_service.get_saved_patterns", return_value=[PATTERN]), \
         patch("api.projects.project_service.get_materials", return_value=[MATERIAL]), \
         patch("api.projects.project_service.get_checklist", return_value=[CHECKLIST_ITEM]):
        resp = client.get("/api/projects/1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Summer Dress"
    assert len(data["patterns"]) == 1
    assert len(data["materials"]) == 1
    assert len(data["checklist"]) == 1


def test_get_project_not_found():
    with patch("api.projects.project_service.get_project", return_value=None):
        resp = client.get("/api/projects/999")
    assert resp.status_code == 404


def test_create_project():
    with patch("api.projects.project_service.create_project", return_value={"id": 1, "name": "Summer Dress"}):
        resp = client.post("/api/projects/", json={"name": "Summer Dress", "description": "A light summer dress", "budget": 80.0})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Summer Dress"


def test_create_project_minimal():
    with patch("api.projects.project_service.create_project", return_value={"id": 2, "name": "Quick Project"}):
        resp = client.post("/api/projects/", json={"name": "Quick Project"})
    assert resp.status_code == 200


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
    with patch("api.projects.project_service.get_checklist", return_value=[CHECKLIST_ITEM]):
        resp = client.get("/api/projects/1/checklist")
    assert resp.status_code == 200
    assert resp.json()[0]["title"] == "Cut fabric pieces"


def test_add_checklist_item():
    with patch("api.projects.project_service.add_checklist_item", return_value={"id": 1, "title": "Cut fabric pieces"}):
        resp = client.post("/api/projects/1/checklist", json={"title": "Cut fabric pieces", "notes": "Use sharp scissors"})
    assert resp.status_code == 200
    assert resp.json()["title"] == "Cut fabric pieces"


def test_add_checklist_item_minimal():
    with patch("api.projects.project_service.add_checklist_item", return_value={"id": 2, "title": "Press seams"}):
        resp = client.post("/api/projects/1/checklist", json={"title": "Press seams"})
    assert resp.status_code == 200


def test_add_checklist_item_missing_title():
    resp = client.post("/api/projects/1/checklist", json={})
    assert resp.status_code == 422


def test_toggle_checklist_item():
    checked_item = {**CHECKLIST_ITEM, "checked": 1}
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
    assert resp.json()[0]["source"] == "simplicity"


def test_save_pattern():
    with patch("api.projects.project_service.save_pattern", return_value={"id": 1, "url": "https://simplicity.com/9898"}):
        resp = client.post("/api/projects/1/patterns", json={
            "source": "simplicity",
            "title": "Simplicity 9898",
            "url": "https://simplicity.com/9898",
            "image_url": "https://simplicity.com/9898.jpg",
            "price": "$14.99",
        })
    assert resp.status_code == 200
    assert resp.json()["url"] == "https://simplicity.com/9898"


def test_save_pattern_url_only():
    with patch("api.projects.project_service.save_pattern", return_value={"id": 2, "url": "https://example.com/pattern"}):
        resp = client.post("/api/projects/1/patterns", json={"url": "https://example.com/pattern"})
    assert resp.status_code == 200


def test_save_pattern_missing_url():
    resp = client.post("/api/projects/1/patterns", json={"title": "No URL"})
    assert resp.status_code == 422


def test_delete_saved_pattern():
    with patch("api.projects.project_service.delete_saved_pattern"):
        resp = client.delete("/api/projects/1/patterns/1")
    assert resp.status_code == 200
    assert resp.json()["deleted"] == 1


# --- Project materials ---

def test_get_materials():
    with patch("api.projects.project_service.get_materials", return_value=[MATERIAL]):
        resp = client.get("/api/projects/1/materials")
    assert resp.status_code == 200
    assert resp.json()[0]["name"] == "Cotton fabric"
    assert resp.json()[0]["quantity"] == "2m"


def test_add_material():
    with patch("api.projects.project_service.add_material", return_value={"id": 1, "name": "Cotton fabric"}):
        resp = client.post("/api/projects/1/materials", json={"name": "Cotton fabric", "quantity": "2m", "notes": "Light blue"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Cotton fabric"


def test_add_material_minimal():
    with patch("api.projects.project_service.add_material", return_value={"id": 2, "name": "Thread"}):
        resp = client.post("/api/projects/1/materials", json={"name": "Thread"})
    assert resp.status_code == 200


def test_add_material_missing_name():
    resp = client.post("/api/projects/1/materials", json={})
    assert resp.status_code == 422


def test_toggle_material_purchased():
    purchased_material = {**MATERIAL, "purchased": 1}
    with patch("api.projects.project_service.toggle_material_purchased", return_value=purchased_material):
        resp = client.patch("/api/projects/1/materials/1/toggle")
    assert resp.status_code == 200
    assert resp.json()["purchased"] == 1


def test_toggle_material_not_found():
    with patch("api.projects.project_service.toggle_material_purchased", return_value=None):
        resp = client.patch("/api/projects/1/materials/999/toggle")
    assert resp.status_code == 404


def test_delete_material():
    with patch("api.projects.project_service.delete_material"):
        resp = client.delete("/api/projects/1/materials/1")
    assert resp.status_code == 200
    assert resp.json()["deleted"] == 1
