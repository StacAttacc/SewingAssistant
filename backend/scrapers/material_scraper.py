from ddgs import DDGS


def search_materials(materials: list[str], max_results: int = 3) -> list[dict]:
    """
    Fast material search using DuckDuckGo directly — no LLM needed.
    Searches for each material separately and returns ranked results.
    """
    all_results = []

    with DDGS() as ddgs:
        for material in materials:
            query = f"buy {material} fabric online sewing"
            results = list(ddgs.text(query, max_results=max_results))
            for r in results:
                all_results.append({
                    "material": material,
                    "store": r.get("title"),
                    "url": r.get("href"),
                    "snippet": r.get("body"),
                })

    return all_results
