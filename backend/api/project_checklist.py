import os
import uuid

from fastapi import APIRouter, HTTPException, UploadFile, File
from services import project_service
from repositories import project_repository
from models.project import ChecklistItemCreate, ChecklistItemUpdate, ChecklistReorder, ChecklistItem

UPLOADS_DIR = os.getenv("UPLOADS_DIR", "uploads")

router = APIRouter()


@router.get("/{project_id}/checklist", response_model=list[ChecklistItem])
def get_checklist(project_id: int):
    return project_service.get_checklist(project_id)


@router.post("/{project_id}/checklist", response_model=dict)
def add_checklist_item(project_id: int, data: ChecklistItemCreate):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    return project_service.add_checklist_item(project_id, data.title, data.notes)


@router.patch("/{project_id}/checklist/reorder", status_code=204)
def reorder_checklist(project_id: int, data: ChecklistReorder):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    project_repository.reorder_checklist(project_id, data.ids)


@router.patch("/{project_id}/checklist/{item_id}/toggle", response_model=ChecklistItem)
def toggle_checklist_item(project_id: int, item_id: int):
    item = project_service.toggle_checklist_item(item_id, project_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.patch("/{project_id}/checklist/{item_id}", response_model=ChecklistItem)
def update_checklist_item(project_id: int, item_id: int, data: ChecklistItemUpdate):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    result = project_service.update_checklist_item(item_id, project_id, data.title, data.notes, data.image_urls)
    if not result:
        raise HTTPException(status_code=404, detail="Item not found")
    return result


@router.post("/{project_id}/checklist/{item_id}/upload-image", response_model=dict)
async def upload_checklist_image(project_id: int, item_id: int, file: UploadFile = File(...)):
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


@router.delete("/{project_id}/checklist/{item_id}")
def delete_checklist_item(project_id: int, item_id: int):
    project_service.delete_checklist_item(item_id, project_id)
    return {"deleted": item_id}
