from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from scrapers.patterns import simplicity_scraper, mood_scraper, black_snail_scraper, truly_victorian_scraper, laughing_moon_scraper
from scrapers.patterns import generic_scraper
from scrapers.material_scraper import search_materials
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


def _scrape_any_url(url: str) -> PatternDetail:
    """Route a URL to its dedicated scraper, or fall back to the generic one."""
    for host, scraper in DETAIL_HOSTS.items():
        if host in url:
            return scraper.scrape_pattern_detail(url)
    return generic_scraper.scrape_from_url(url)


class PatternSearchRequest(BaseModel):
    query: str
    source: str = "simplicity"  # "simplicity" | "mood" | "black_snail" | "truly_victorian"


class FromUrlRequest(BaseModel):
    url: str


class PatternMaterialsResponse(BaseModel):
    pattern: PatternDetail
    purchase_links: list[dict]


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


@router.post("/from-url", response_model=PatternDetail)
def pattern_from_url(req: FromUrlRequest):
    """
    Scrape a pattern from any URL.
    Known hosts (Simplicity, Truly Victorian, etc.) use their dedicated scraper.
    Everything else falls back to a generic best-effort scraper.
    """
    if not req.url.strip():
        raise HTTPException(status_code=400, detail="URL cannot be empty")
    return _scrape_any_url(req.url)


@router.post("/materials", response_model=PatternMaterialsResponse)
def pattern_materials(req: FromUrlRequest):
    """
    Given any pattern URL, scrape the pattern and return purchase links for all
    its fabric recommendations and notions.
    """
    if not req.url.strip():
        raise HTTPException(status_code=400, detail="URL cannot be empty")
    detail = _scrape_any_url(req.url)
    all_materials = detail.fabric_recommendations + detail.notions
    purchase_links = search_materials(all_materials) if all_materials else []
    return PatternMaterialsResponse(pattern=detail, purchase_links=purchase_links)
