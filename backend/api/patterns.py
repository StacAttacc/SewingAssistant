from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from scrapers.pattern_scraper import search_patterns

router = APIRouter()


class PatternSearchRequest(BaseModel):
    query: str


@router.post("/search")
def pattern_search(req: PatternSearchRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    results = search_patterns(req.query)
    return {"results": results}
