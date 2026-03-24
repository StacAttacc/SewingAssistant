from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services import project_service
from services import llm_service

router = APIRouter()


class SuggestRequest(BaseModel):
    project_id: int


@router.post("/suggest-patterns", response_model=str)
def suggest_patterns(req: SuggestRequest):
    """Return a single search query to find patterns for a project."""
    project = project_service.get_project(req.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    try:
        return llm_service.suggest_patterns(
            project["name"], project.get("description", "")
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@router.post("/suggest-materials", response_model=str)
def suggest_materials(req: SuggestRequest):
    """Return a single word to search for materials for a project."""
    project = project_service.get_project(req.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    try:
        return llm_service.suggest_materials(
            project["name"], project.get("description", "")
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))
