from pydantic import BaseModel


class PatternSearchResult(BaseModel):
    """Returned from search across any pattern source."""
    source: str
    title: str
    pattern_number: str | None = None
    brand: str | None = None
    difficulty: str | None = None
    price: str | None = None
    image_url: str | None = None
    url: str


class PatternDetail(BaseModel):
    """Returned from scraping a specific pattern page."""
    source: str
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
