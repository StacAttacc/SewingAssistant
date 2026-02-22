from pydantic import BaseModel


class PatternSearchResult(BaseModel):
    """Returned from search (Simplicity site or DuckDuckGo fallback)."""
    title: str
    pattern_number: str | None = None
    brand: str | None = None
    difficulty: str | None = None
    price: str | None = None
    image_url: str | None = None
    url: str


class PatternDetail(BaseModel):
    """Returned from scraping a specific pattern page."""
    title: str
    pattern_number: str | None = None
    brand: str | None = None
    difficulty: str | None = None
    sizes: str | None = None
    price: str | None = None
    fabric_recommendations: list[str] = []
    notions: list[str] = []
    image_url: str | None = None
    url: str
