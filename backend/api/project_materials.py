import os
import uuid

from fastapi import APIRouter, HTTPException, UploadFile, File
from services import project_service
from models.project import (
    ProjectMaterialCreate,
    ProjectMaterialUpdate,
    ProjectMaterialFullEdit,
    ProjectMaterial,
)

UPLOADS_DIR = os.getenv("UPLOADS_DIR", "uploads")

router = APIRouter()


@router.post("/{project_id}/materials/upload-image", response_model=dict)
async def upload_material_image(project_id: int, file: UploadFile = File(...)):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    ext = os.path.splitext(file.filename or "")[1].lower()
    allowed = {".jpg", ".jpeg", ".png", ".webp"}
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: {allowed}")
    max_bytes = 10 * 1024 * 1024
    content = await file.read(max_bytes + 1)
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB)")
    filename = f"{uuid.uuid4()}{ext}"
    dest = os.path.join(UPLOADS_DIR, filename)
    with open(dest, "wb") as f:
        f.write(content)
    return {"url": f"/uploads/{filename}"}


@router.get("/{project_id}/materials", response_model=list[ProjectMaterial])
def get_materials(project_id: int):
    return project_service.get_materials(project_id)


@router.post("/{project_id}/materials", response_model=dict)
def add_material(project_id: int, data: ProjectMaterialCreate):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    return project_service.add_material(
        project_id, data.name, data.quantity, data.notes, data.image_url, data.price,
        data.care_instructions, data.grain_direction, data.pre_wash,
    )


@router.patch("/{project_id}/materials/{material_id}", response_model=ProjectMaterial)
def update_material(project_id: int, material_id: int, data: ProjectMaterialUpdate):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    result = project_service.update_material(material_id, project_id, data.purchased, data.price, data.quantity)
    if not result:
        raise HTTPException(status_code=404, detail="Material not found")
    return result


@router.patch("/{project_id}/materials/{material_id}/edit", response_model=ProjectMaterial)
def edit_material(project_id: int, material_id: int, data: ProjectMaterialFullEdit):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    result = project_service.edit_material(
        material_id, project_id, data.name, data.quantity, data.notes, data.image_url, data.price,
        data.care_instructions, data.grain_direction, data.pre_wash,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Material not found")
    return result


@router.delete("/{project_id}/materials/{material_id}")
def delete_material(project_id: int, material_id: int):
    project_service.delete_material(material_id, project_id)
    return {"deleted": material_id}
