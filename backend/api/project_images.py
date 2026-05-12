import os
import uuid

from fastapi import APIRouter, HTTPException, UploadFile, File
from services import project_service
from models.project import ProjectProgressImage

UPLOADS_DIR = os.getenv("UPLOADS_DIR", "uploads")

router = APIRouter()


@router.get("/{project_id}/progress-images", response_model=list[ProjectProgressImage])
def get_progress_images(project_id: int):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    return project_service.get_progress_images(project_id)


@router.post("/{project_id}/progress-images", response_model=ProjectProgressImage, status_code=201)
async def upload_progress_image(project_id: int, file: UploadFile = File(...)):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    ext = os.path.splitext(file.filename or "")[1].lower()
    allowed = {".jpg", ".jpeg", ".png", ".webp"}
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: {allowed}")
    max_bytes = 20 * 1024 * 1024
    content = await file.read(max_bytes + 1)
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail="File too large (max 20 MB)")
    filename = f"{uuid.uuid4()}{ext}"
    dest = os.path.join(UPLOADS_DIR, filename)
    with open(dest, "wb") as f:
        f.write(content)
    return project_service.add_progress_image(project_id, f"/uploads/{filename}")


@router.delete("/{project_id}/progress-images/{image_id}", status_code=204)
def delete_progress_image(project_id: int, image_id: int):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    project_service.delete_progress_image(image_id, project_id)
