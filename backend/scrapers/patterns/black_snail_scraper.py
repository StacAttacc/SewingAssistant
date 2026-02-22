import httpx
from models.pattern import PatternSearchResult, PatternDetail

BASE_URL = "https://blacksnailpatterns.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

# Era-based collection handles for browsing
COLLECTIONS = {
    "free": "gratis-schnittmuster",
    "1700-1790": "pdf-women-1700-1790",
    "1790-1820": "pdf-women-1790-1820",
    "1820-1860": "pdf-women-1820-1860",
    "1860-1910": "pdf-women-1860-1910",
    "men-1700-1820": "pdf-men-1700-1820",
    "men-1820-1860": "pdf-men-1820-1860",
    "men-1860-1910": "pdf-men-1860-1910",
    "children": "pdf-kinder",
}


def search_patterns(query: str, max_results: int = 10) -> list[PatternSearchResult]:
    """
    Search Black Snail Patterns using the Shopify products JSON API.
    Fetches the full catalog and filters by title or tags matching the query.
    No scraping needed — Shopify exposes a public /products.json endpoint.
    """
    resp = httpx.get(
        f"{BASE_URL}/products.json",
        params={"limit": 250},
        headers=HEADERS,
        timeout=15,
    )
    resp.raise_for_status()

    products = resp.json().get("products", [])
    query_lower = query.lower()

    results = []
    for product in products:
        title = product.get("title", "")
        tags = product.get("tags", [])
        if query_lower not in title.lower() and not any(query_lower in t.lower() for t in tags):
            continue

        results.append(_product_to_search_result(product))
        if len(results) >= max_results:
            break

    return results


def list_free_patterns() -> list[PatternSearchResult]:
    """Return all patterns in the Gratis Schnittmuster (free) collection."""
    resp = httpx.get(
        f"{BASE_URL}/collections/gratis-schnittmuster/products.json",
        headers=HEADERS,
        timeout=15,
    )
    resp.raise_for_status()
    products = resp.json().get("products", [])
    return [_product_to_search_result(p) for p in products]


def scrape_pattern_detail(url: str) -> PatternDetail:
    """
    Fetch full pattern details using the Shopify product JSON API.
    Converts the product handle from the URL to a /products/{handle}.json request.
    """
    handle = _handle_from_url(url)
    resp = httpx.get(
        f"{BASE_URL}/products/{handle}.json",
        headers=HEADERS,
        timeout=15,
    )
    resp.raise_for_status()

    product = resp.json().get("product")
    if not product:
        return PatternDetail(source="black_snail", title="Unknown", brand="Black Snail Patterns", url=url)

    title = product.get("title", "Unknown")
    price = product.get("variants", [{}])[0].get("price")
    image_url = (product.get("images") or [{}])[0].get("src")

    return PatternDetail(
        source="black_snail",
        title=title,
        brand="Black Snail Patterns",
        price=price,
        image_url=image_url,
        url=url,
    )


def _product_to_search_result(product: dict) -> PatternSearchResult:
    handle = product.get("handle", "")
    price = product.get("variants", [{}])[0].get("price")
    image_url = (product.get("images") or [{}])[0].get("src")
    return PatternSearchResult(
        source="black_snail",
        title=product.get("title", ""),
        brand="Black Snail Patterns",
        price=price,
        image_url=image_url,
        url=f"{BASE_URL}/products/{handle}",
    )


def _handle_from_url(url: str) -> str:
    """Extract the Shopify product handle from a product URL."""
    # e.g. https://blacksnailpatterns.com/products/my-pattern → my-pattern
    parts = url.rstrip("/").split("/products/")
    return parts[-1] if len(parts) > 1 else url
