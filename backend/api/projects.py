from fastapi import APIRouter, HTTPException
from services import project_service
from models.project import (
    ProjectCreate, Project,
    ChecklistItemCreate, ChecklistItem,
    ProjectPatternSave, ProjectPattern,
    ProjectMaterialCreate, ProjectMaterial,
    ProjectDetail,
)

router = APIRouter()


# --- Projects ---

@router.get("/", response_model=list[Project])
def list_projects():
    return project_service.list_projects()


@router.get("/{project_id}", response_model=ProjectDetail)
def get_project(project_id: int):
    project = project_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectDetail(
        **project,
        patterns=project_service.get_saved_patterns(project_id),
        materials=project_service.get_materials(project_id),
        checklist=project_service.get_checklist(project_id),
    )


@router.post("/", response_model=dict)
def create_project(data: ProjectCreate):
    return project_service.create_project(data.name, data.description, data.budget)


@router.delete("/{project_id}")
def delete_project(project_id: int):
    project_service.delete_project(project_id)
    return {"deleted": project_id}


# --- Checklist ---

@router.get("/{project_id}/checklist", response_model=list[ChecklistItem])
def get_checklist(project_id: int):
    return project_service.get_checklist(project_id)


@router.post("/{project_id}/checklist", response_model=dict)
def add_checklist_item(project_id: int, data: ChecklistItemCreate):
    return project_service.add_checklist_item(project_id, data.title, data.notes)


@router.patch("/{project_id}/checklist/{item_id}/toggle", response_model=ChecklistItem)
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

@router.get("/{project_id}/patterns", response_model=list[ProjectPattern])
def get_saved_patterns(project_id: int):
    return project_service.get_saved_patterns(project_id)


@router.post("/{project_id}/patterns", response_model=dict)
def save_pattern(project_id: int, data: ProjectPatternSave):
    return project_service.save_pattern(
        project_id, data.source, data.title, data.url, data.image_url, data.price
    )


@router.delete("/{project_id}/patterns/{pattern_id}")
def delete_saved_pattern(project_id: int, pattern_id: int):
    project_service.delete_saved_pattern(pattern_id, project_id)
    return {"deleted": pattern_id}


# --- Project materials ---

@router.get("/{project_id}/materials", response_model=list[ProjectMaterial])
def get_materials(project_id: int):
    return project_service.get_materials(project_id)


@router.post("/{project_id}/materials", response_model=dict)
def add_material(project_id: int, data: ProjectMaterialCreate):
    return project_service.add_material(project_id, data.name, data.quantity, data.notes)


@router.patch("/{project_id}/materials/{material_id}/toggle", response_model=ProjectMaterial)
def toggle_material_purchased(project_id: int, material_id: int):
    material = project_service.toggle_material_purchased(material_id, project_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return material


@router.delete("/{project_id}/materials/{material_id}")
def delete_material(project_id: int, material_id: int):
    project_service.delete_material(material_id, project_id)
    return {"deleted": material_id}
