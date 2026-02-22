from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from scrapers.simplicity_scraper import search_patterns, scrape_pattern_detail
from models.pattern import PatternSearchResult, PatternDetail

router = APIRouter()


class PatternSearchRequest(BaseModel):
    query: str


@router.post("/search", response_model=list[PatternSearchResult])
def pattern_search(req: PatternSearchRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    return search_patterns(req.query)


@router.get("/detail", response_model=PatternDetail)
def pattern_detail(url: str):
    if not url.startswith("https://simplicity.com"):
        raise HTTPException(status_code=400, detail="Only simplicity.com URLs are supported")
    return scrape_pattern_detail(url)
