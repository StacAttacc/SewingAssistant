from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services import project_service

router = APIRouter()


# --- Schemas ---

class ProjectCreate(BaseModel):
    name: str
    notes: str = ""

class ChecklistItemCreate(BaseModel):
    name: str
    quantity: str = ""

class SavedPatternCreate(BaseModel):
    title: str = ""
    url: str
    snippet: str = ""


# --- Projects ---

@router.get("/")
def list_projects():
    return project_service.list_projects()


@router.post("/")
def create_project(data: ProjectCreate):
    return project_service.create_project(data.name, data.notes)


@router.delete("/{project_id}")
def delete_project(project_id: int):
    project_service.delete_project(project_id)
    return {"deleted": project_id}


# --- Checklist ---

@router.get("/{project_id}/checklist")
def get_checklist(project_id: int):
    return project_service.get_checklist(project_id)


@router.post("/{project_id}/checklist")
def add_checklist_item(project_id: int, data: ChecklistItemCreate):
    return project_service.add_checklist_item(project_id, data.name, data.quantity)


@router.patch("/{project_id}/checklist/{item_id}/toggle")
def toggle_checklist_item(project_id: int, item_id: int):
    item = project_service.toggle_checklist_item(item_id, project_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.delete("/{project_id}/checklist/{item_id}")
def delete_checklist_item(project_id: int, item_id: int):
    project_service.delete_checklist_item(item_id, project_id)
    return {"deleted": item_id}


# --- Saved patterns ---

@router.get("/{project_id}/patterns")
def get_saved_patterns(project_id: int):
    return project_service.get_saved_patterns(project_id)


@router.post("/{project_id}/patterns")
def save_pattern(project_id: int, data: SavedPatternCreate):
    return project_service.save_pattern(project_id, data.title, data.url, data.snippet)


@router.delete("/{project_id}/patterns/{pattern_id}")
def delete_saved_pattern(project_id: int, pattern_id: int):
    project_service.delete_saved_pattern(pattern_id, project_id)
    return {"deleted": pattern_id}
