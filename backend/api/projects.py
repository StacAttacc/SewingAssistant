import json
import os
import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from services import project_service, measurements_service
from services import pattern_generator

UPLOADS_DIR = os.getenv("UPLOADS_DIR", "uploads")
from models.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectStatusUpdate,
    Project,
    ChecklistItemCreate,
    ChecklistItem,
    ProjectPatternSave,
    ProjectPattern,
    ProjectMaterialCreate,
    ProjectMaterial,
    ProjectDetail,
    GeneratePatternRequest,
    ProjectMeasurementSetCreate,
    ProjectMeasurementSet,
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
    return ProjectDetail.model_validate(
        {
            **project,
            "patterns": project_service.get_saved_patterns(project_id),
            "materials": project_service.get_materials(project_id),
            "checklist": project_service.get_checklist(project_id),
            "measurement_sets": project_service.get_measurement_sets(project_id),
            "global_measurement_sets": measurements_service.get_for_project(project_id),
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
    result = project_service.update_project(project_id, data.name, data.description, data.budget)
    return result


@router.patch("/{project_id}/status", response_model=Project)
def update_project_status(project_id: int, data: ProjectStatusUpdate):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    result = project_service.update_project_status(project_id, data.status)
    return result


@router.delete("/{project_id}")
def delete_project(project_id: int):
    project_service.delete_project(project_id)
    return {"deleted": project_id}


@router.delete("/{project_id}/global-measurement-sets/{global_ms_id}", status_code=204)
def unlink_global_measurement_set(project_id: int, global_ms_id: int):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    measurements_service.unlink_from_project(project_id, global_ms_id)


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


@router.post("/{project_id}/patterns/generate", response_model=list[ProjectPattern])
def generate_pattern(project_id: int, req: GeneratePatternRequest):
    project = project_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if req.garment_type == "skirt":
        try:
            result = pattern_generator.generate_skirt(req.measurements.model_dump(), req.style_params.model_dump())
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc))
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported garment type: {req.garment_type}")

    # Save the combined PDF as the pattern record
    saved = project_service.save_pattern(
        project_id,
        source="generated",
        title=result["title"],
        url=result["pdf_url"],
        image_url=None,
        price=None,
    )
    # Fetch and return the saved pattern
    patterns = project_service.get_saved_patterns(project_id)
    return [p for p in patterns if p["id"] == saved["id"]]


# --- Checklist ---


@router.get("/{project_id}/checklist", response_model=list[ChecklistItem])
def get_checklist(project_id: int):
    return project_service.get_checklist(project_id)


@router.post("/{project_id}/checklist", response_model=dict)
def add_checklist_item(project_id: int, data: ChecklistItemCreate):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
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


@router.post("/{project_id}/patterns/upload", response_model=dict)
async def upload_pattern(
    project_id: int,
    file: UploadFile = File(...),
    title: str = Form(""),
):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    ext = os.path.splitext(file.filename or "")[1].lower()
    allowed = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
    if ext not in allowed:
        raise HTTPException(
            status_code=400, detail=f"File type not allowed. Allowed: {allowed}"
        )
    max_bytes = 20 * 1024 * 1024  # 20 MB
    content = await file.read(max_bytes + 1)
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail="File too large (max 20 MB)")
    filename = f"{uuid.uuid4()}{ext}"
    dest = os.path.join(UPLOADS_DIR, filename)
    with open(dest, "wb") as f:
        f.write(content)
    url = f"/uploads/{filename}"
    return project_service.save_pattern(
        project_id,
        source="upload",
        title=title or file.filename or "",
        url=url,
        image_url=url if ext in {".jpg", ".jpeg", ".png", ".webp"} else None,
        price=None,
    )


# --- Project materials ---


@router.get("/{project_id}/materials", response_model=list[ProjectMaterial])
def get_materials(project_id: int):
    return project_service.get_materials(project_id)


@router.post("/{project_id}/materials", response_model=dict)
def add_material(project_id: int, data: ProjectMaterialCreate):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    return project_service.add_material(
        project_id, data.name, data.quantity, data.notes, data.image_url
    )


@router.patch(
    "/{project_id}/materials/{material_id}/toggle", response_model=ProjectMaterial
)
def toggle_material_purchased(project_id: int, material_id: int):
    material = project_service.toggle_material_purchased(material_id, project_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return material


@router.delete("/{project_id}/materials/{material_id}")
def delete_material(project_id: int, material_id: int):
    project_service.delete_material(material_id, project_id)
    return {"deleted": material_id}
