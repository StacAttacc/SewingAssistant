from ddgs import DDGS
from models.material import FabricSearchResult

SOURCE = "cleanersupply"
SITE = "cleanersupply.ca"


def search(query: str, max_results: int = 10) -> list[FabricSearchResult]:
    """
    Search Cleanersupply.ca (tailoring/sewing accessories) via DuckDuckGo.
    The site is Vue.js rendered so direct scraping is not feasible.
    """
    results = []
    with DDGS() as ddgs:
        hits = ddgs.text(f"site:{SITE} {query}", max_results=max_results)
        for hit in hits:
            results.append(FabricSearchResult(
                source=SOURCE,
                title=hit.get("title", ""),
                url=hit.get("href", ""),
            ))
    return results
