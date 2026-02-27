from scrapers.materials._prestashop import search as _prestashop_search
from models.material import FabricSearchResult

BASE_URL = "https://tonitex.com"
SOURCE = "tonitex"


def search(query: str, max_results: int = 10) -> list[FabricSearchResult]:
    """Search Tonitex (PrestaShop wholesale fabric store, Montreal)."""
    return _prestashop_search(BASE_URL, SOURCE, query, max_results)
