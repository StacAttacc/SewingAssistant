from fastapi import APIRouter, HTTPException
from services import project_service, measurements_service
from models.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectStatusUpdate,
    Project,
    ProjectDetail,
    ProjectPattern,
    ProjectMaterial,
    ChecklistItem,
    ProjectMeasurementSet,
    GlobalMeasurementSet,
    ProjectProgressImage,
)

router = APIRouter()


@router.get("/", response_model=list[Project])
def list_projects():
    return project_service.list_projects()


@router.get("/{project_id}", response_model=ProjectDetail)
def get_project(project_id: int):
    project = project_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectDetail.model_validate(
        {
            **project,
            "patterns": project_service.get_saved_patterns(project_id),
            "materials": project_service.get_materials(project_id),
            "checklist": project_service.get_checklist(project_id),
            "measurement_sets": project_service.get_measurement_sets(project_id),
            "global_measurement_sets": measurements_service.get_for_project(project_id),
            "progress_images": project_service.get_progress_images(project_id),
        }
    )


@router.post("/", response_model=dict)
def create_project(data: ProjectCreate):
    created = project_service.create_project(data.name, data.description, data.budget)
    if data.global_measurement_set_ids:
        measurements_service.link_to_project(created["id"], data.global_measurement_set_ids)
    return created


@router.patch("/{project_id}", response_model=Project)
def update_project(project_id: int, data: ProjectUpdate):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    return project_service.update_project(project_id, data.name, data.description, data.budget)


@router.patch("/{project_id}/status", response_model=Project)
def update_project_status(project_id: int, data: ProjectStatusUpdate):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    return project_service.update_project_status(project_id, data.status)


@router.delete("/{project_id}")
def delete_project(project_id: int):
    project_service.delete_project(project_id)
    return {"deleted": project_id}


@router.delete("/{project_id}/global-measurement-sets/{global_ms_id}", status_code=204)
def unlink_global_measurement_set(project_id: int, global_ms_id: int):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    measurements_service.unlink_from_project(project_id, global_ms_id)
