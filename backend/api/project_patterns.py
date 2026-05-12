import os
import uuid

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from services import project_service, llm_service
from services import pattern_generator
from models.project import (
    ProjectPatternSave,
    ProjectPatternUpdate,
    ProjectPattern,
    GeneratePatternRequest,
    AIPatternRequest,
)

UPLOADS_DIR = os.getenv("UPLOADS_DIR", "uploads")

router = APIRouter()


@router.post("/{project_id}/patterns/generate-ai", response_model=list[ProjectPattern])
def generate_pattern_ai(project_id: int, req: AIPatternRequest):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    try:
        spec = llm_service.generate_pattern_spec(req.prompt, req.measurements)
        result = pattern_generator.generate_from_spec(spec)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    saved = project_service.save_pattern(
        project_id,
        source="generated",
        title=result["title"],
        url=result["pdf_url"],
        image_url=None,
        price=None,
    )
    patterns = project_service.get_saved_patterns(project_id)
    return [p for p in patterns if p["id"] == saved["id"]]


@router.post("/{project_id}/patterns/generate", response_model=list[ProjectPattern])
def generate_pattern(project_id: int, req: GeneratePatternRequest):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    if req.garment_type == "skirt":
        try:
            result = pattern_generator.generate_skirt(req.measurements.model_dump(), req.style_params.model_dump())
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc))
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported garment type: {req.garment_type}")
    saved = project_service.save_pattern(
        project_id,
        source="generated",
        title=result["title"],
        url=result["pdf_url"],
        image_url=None,
        price=None,
    )
    patterns = project_service.get_saved_patterns(project_id)
    return [p for p in patterns if p["id"] == saved["id"]]


@router.get("/{project_id}/patterns", response_model=list[ProjectPattern])
def get_saved_patterns(project_id: int):
    return project_service.get_saved_patterns(project_id)


@router.post("/{project_id}/patterns", response_model=dict)
def save_pattern(project_id: int, data: ProjectPatternSave):
    return project_service.save_pattern(
        project_id, data.source, data.title, data.url, data.image_url, data.price, data.notes, data.price_paid
    )


@router.patch("/{project_id}/patterns/{pattern_id}", response_model=ProjectPattern)
def update_pattern(project_id: int, pattern_id: int, data: ProjectPatternUpdate):
    result = project_service.update_pattern(pattern_id, project_id, data.title, data.notes, data.price_paid)
    if not result:
        raise HTTPException(status_code=404, detail="Pattern not found")
    return result


@router.delete("/{project_id}/patterns/{pattern_id}")
def delete_saved_pattern(project_id: int, pattern_id: int):
    project_service.delete_saved_pattern(pattern_id, project_id)
    return {"deleted": pattern_id}


@router.post("/{project_id}/patterns/upload", response_model=dict)
async def upload_pattern(
    project_id: int,
    file: UploadFile = File(...),
    title: str = Form(""),
    notes: str = Form(""),
    price_paid: float | None = Form(None),
):
    if not project_service.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    ext = os.path.splitext(file.filename or "")[1].lower()
    allowed = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
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
    url = f"/uploads/{filename}"
    return project_service.save_pattern(
        project_id,
        source="upload",
        title=title or file.filename or "",
        url=url,
        image_url=url if ext in {".jpg", ".jpeg", ".png", ".webp"} else None,
        price=None,
        notes=notes or None,
        price_paid=price_paid,
    )
