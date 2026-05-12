from fastapi import APIRouter, HTTPException
from services import project_service
from models.project import ProjectMeasurementSetCreate, ProjectMeasurementSet

router = APIRouter()


@router.get("/{project_id}/measurement-sets", response_model=list[ProjectMeasurementSet])
def list_measurement_sets(project_id: int):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    return project_service.get_measurement_sets(project_id)


@router.post("/{project_id}/measurement-sets", response_model=ProjectMeasurementSet, status_code=201)
def create_measurement_set(project_id: int, data: ProjectMeasurementSetCreate):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    measurements = data.measurements.model_dump(exclude_none=True)
    return project_service.add_measurement_set(project_id, data.name, measurements)


@router.patch("/{project_id}/measurement-sets/{ms_id}", response_model=ProjectMeasurementSet)
def update_measurement_set(project_id: int, ms_id: int, data: ProjectMeasurementSetCreate):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    measurements = data.measurements.model_dump(exclude_none=True)
    result = project_service.update_measurement_set(ms_id, project_id, data.name, measurements)
    if not result:
        raise HTTPException(status_code=404, detail="Measurement set not found")
    return result


@router.delete("/{project_id}/measurement-sets/{ms_id}", status_code=204)
def delete_measurement_set(project_id: int, ms_id: int):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    project_service.delete_measurement_set(ms_id, project_id)
