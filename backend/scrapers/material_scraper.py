from scrapegraphai.graphs import SearchGraph
from config import SCRAPER_CONFIG


def search_materials(materials: list[str]) -> list[dict]:
    """Search for where to buy a list of fabric/materials online."""
    materials_str = ", ".join(materials)
    graph = SearchGraph(
        prompt=f"""
        Find online stores selling these sewing materials: {materials_str}
        For each result return:
        - material: which material this result is for
        - store: store name
        - product_name: specific product name
        - price: price if visible
        - url: direct link to buy
        Return up to 3 results per material.
        """,
        config=SCRAPER_CONFIG,
    )
    result = graph.run()
    if isinstance(result, list):
        return result
    return [result] if result else []
