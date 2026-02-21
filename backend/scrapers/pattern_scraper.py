from scrapegraphai.graphs import SmartScraperGraph, SearchGraph
from config import SCRAPER_CONFIG


PATTERN_SOURCES = [
    "https://www.simplicity.com",
    "https://www.mccall.com",
]


def search_patterns(query: str) -> list[dict]:
    """Search the web for sewing patterns matching the query."""
    graph = SearchGraph(
        prompt=f"""
        Find sewing patterns for: {query}
        For each result return:
        - name: pattern name
        - pattern_number: e.g. S9876
        - brand: e.g. Simplicity, McCall's
        - difficulty: e.g. Easy, Intermediate
        - sizes: available sizes
        - url: direct link to the pattern
        Return a list of up to 5 patterns.
        """,
        config=SCRAPER_CONFIG,
    )
    result = graph.run()
    if isinstance(result, list):
        return result
    return [result] if result else []


def scrape_pattern_detail(url: str) -> dict:
    """Scrape full details from a specific pattern page."""
    graph = SmartScraperGraph(
        prompt="""Extract the following from this sewing pattern page:
        - name
        - pattern_number
        - brand
        - description
        - difficulty
        - sizes
        - fabric_recommendations (list of suggested fabrics)
        - notions (zippers, buttons, etc.)
        - price
        - image_url
        """,
        source=url,
        config=SCRAPER_CONFIG,
    )
    return graph.run()
