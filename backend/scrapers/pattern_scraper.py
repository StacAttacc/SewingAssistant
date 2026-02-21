from ddgs import DDGS


def search_patterns(query: str, max_results: int = 5) -> list[dict]:
    """Search for sewing patterns using DuckDuckGo."""
    full_query = f"sewing pattern {query} site:simplicity.com OR site:mccall.com OR site:burdastyle.com"
    with DDGS() as ddgs:
        results = list(ddgs.text(full_query, max_results=max_results))

    return [
        {
            "title": r.get("title"),
            "url": r.get("href"),
            "snippet": r.get("body"),
        }
        for r in results
    ]
