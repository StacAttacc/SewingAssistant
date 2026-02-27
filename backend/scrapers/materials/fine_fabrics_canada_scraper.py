from scrapers.materials._prestashop import search as _prestashop_search
from models.material import FabricSearchResult

BASE_URL = "https://finefabricscanada.com"
SOURCE = "fine_fabrics_canada"


def search(query: str, max_results: int = 10) -> list[FabricSearchResult]:
    """Search Fine Fabrics Canada (PrestaShop, mid-to-high-end online retailer)."""
    return _prestashop_search(BASE_URL, SOURCE, query, max_results)
