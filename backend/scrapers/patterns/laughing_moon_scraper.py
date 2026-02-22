from ddgs import DDGS
from models.pattern import PatternSearchResult

BASE_URL = "laughingmoonmercantile.com"


def search_patterns(query: str, max_results: int = 10) -> list[PatternSearchResult]:
    """
    Search Laughing Moon Mercantile via DuckDuckGo site search.
    The site runs on Wix (JavaScript-rendered) so direct scraping isn't feasible.
    Results include title and URL — enough to link through to the actual product.
    """
    results = []
    with DDGS() as ddgs:
        hits = ddgs.text(f"site:{BASE_URL} {query}", max_results=max_results)
        for hit in hits:
            url = hit.get("href", "")
            title = hit.get("title", "")
            if not url or not title:
                continue
            results.append(PatternSearchResult(
                title=title,
                brand="Laughing Moon Mercantile",
                url=url,
            ))
    return results
