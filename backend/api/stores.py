from fastapi import APIRouter
from pydantic import BaseModel
from services.store_finder import find_nearby_stores
from scrapers.material_scraper import search_materials

router = APIRouter()


class LocationRequest(BaseModel):
    lat: float
    lon: float
    radius_m: int = 10000


class MaterialsRequest(BaseModel):
    materials: list[str]  # e.g. ["cotton fabric", "invisible zipper", "interfacing"]


@router.post("/nearby")
async def nearby_stores(req: LocationRequest):
    stores = await find_nearby_stores(req.lat, req.lon, req.radius_m)
    return {"stores": stores}


@router.post("/materials")
def find_materials(req: MaterialsRequest):
    if not req.materials:
        return {"results": []}
    results = search_materials(req.materials)
    return {"results": results}
