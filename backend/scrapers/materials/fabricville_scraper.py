from scrapers.materials._shopify import search as _shopify_search
from models.material import FabricSearchResult

BASE_URL = "https://fabricville.com"
SOURCE = "fabricville"


def search(query: str, max_results: int = 10) -> list[FabricSearchResult]:
    """Search Fabricville (Shopify, Canadian retail fabric chain)."""
    return _shopify_search(BASE_URL, SOURCE, query, max_results)
