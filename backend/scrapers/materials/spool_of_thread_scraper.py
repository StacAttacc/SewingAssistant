from scrapers.materials._shopify import search as _shopify_search
from models.material import FabricSearchResult

BASE_URL = "https://spoolofthread.com"
SOURCE = "spool_of_thread"


def search(query: str, max_results: int = 10) -> list[FabricSearchResult]:
    """Search Spool of Thread (Shopify, Vancouver — sells by the half-yard, no patterns)."""
    return _shopify_search(BASE_URL, SOURCE, query, max_results)
