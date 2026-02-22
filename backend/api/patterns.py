from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from scrapers.patterns import simplicity_scraper, mood_scraper, black_snail_scraper, truly_victorian_scraper, laughing_moon_scraper
from models.pattern import PatternSearchResult, PatternDetail

router = APIRouter()

SCRAPERS = {
    "simplicity": simplicity_scraper,
    "mood": mood_scraper,
    "black_snail": black_snail_scraper,
    "truly_victorian": truly_victorian_scraper,
    "laughing_moon": laughing_moon_scraper,
}

DETAIL_HOSTS = {
    "simplicity.com": simplicity_scraper,
    "blog.moodfabrics.com": mood_scraper,
    "blacksnailpatterns.com": black_snail_scraper,
    "trulyvictorian.info": truly_victorian_scraper,
}


class PatternSearchRequest(BaseModel):
    query: str
    source: str = "simplicity"  # "simplicity" | "mood" | "black_snail" | "truly_victorian"


@router.post("/search", response_model=list[PatternSearchResult])
def pattern_search(req: PatternSearchRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    scraper = SCRAPERS.get(req.source)
    if not scraper:
        raise HTTPException(status_code=400, detail=f"Unknown source '{req.source}'. Valid: {list(SCRAPERS)}")
    return scraper.search_patterns(req.query)


@router.get("/detail", response_model=PatternDetail)
def pattern_detail(url: str):
    for host, scraper in DETAIL_HOSTS.items():
        if host in url:
            return scraper.scrape_pattern_detail(url)
    raise HTTPException(
        status_code=400,
        detail=f"Unsupported URL. Supported hosts: {list(DETAIL_HOSTS)}",
    )


@router.get("/black-snail/free", response_model=list[PatternSearchResult])
def black_snail_free():
    """List all free patterns from Black Snail Patterns."""
    return black_snail_scraper.list_free_patterns()
