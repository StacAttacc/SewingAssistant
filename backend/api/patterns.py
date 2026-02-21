from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from scrapers.pattern_scraper import search_patterns, scrape_pattern_detail

router = APIRouter()


class PatternSearchRequest(BaseModel):
    query: str  # e.g. "women's blazer intermediate"


@router.post("/search")
def pattern_search(req: PatternSearchRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    results = search_patterns(req.query)
    return {"results": results}


@router.get("/detail")
def pattern_detail(url: str):
    if not url.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid URL")
    result = scrape_pattern_detail(url)
    return result
