from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services import material_service
from models.material import FabricSearchResult

router = APIRouter()


class FabricSearchRequest(BaseModel):
    query: str
    source: str  # "tonitex" | "fabricville" | "spool_of_thread" | "fine_fabrics_canada" | "the_fabric_club" | "cleanersupply"


@router.get("/sources")
def list_sources():
    """List all available fabric/accessories store sources."""
    return {"sources": material_service.list_sources()}


@router.post("/search", response_model=list[FabricSearchResult])
def search_fabrics(req: FabricSearchRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    try:
        return material_service.search_fabrics(req.query, req.source)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
