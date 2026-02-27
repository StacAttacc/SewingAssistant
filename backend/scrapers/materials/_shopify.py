"""Shared helper for Shopify stores using the suggest.json endpoint."""
import httpx
from models.material import FabricSearchResult

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}


def search(base_url: str, source: str, query: str, max_results: int = 10) -> list[FabricSearchResult]:
    url = (
        f"{base_url}/search/suggest.json"
        f"?q={query}&resources[type]=product&resources[limit]={max_results}"
    )
    resp = httpx.get(url, headers=HEADERS, timeout=15, follow_redirects=True)
    resp.raise_for_status()

    data = resp.json()
    products = data.get("resources", {}).get("results", {}).get("products", [])

    results = []
    for product in products:
        raw_price = product.get("price")
        price = _format_price(raw_price) if raw_price else None

        product_url = product.get("url", "")
        if product_url and not product_url.startswith("http"):
            product_url = f"{base_url}{product_url}"

        results.append(FabricSearchResult(
            source=source,
            title=product.get("title", ""),
            price=price,
            image_url=product.get("image"),
            url=product_url,
        ))

    return results


def _format_price(raw: str) -> str:
    """Shopify suggest.json returns prices as plain number strings (e.g. '12.99')."""
    raw = str(raw).strip()
    # Already has a currency symbol — return as-is
    if any(sym in raw for sym in ("$", "£", "€", "CAD", "USD")):
        return raw
    # Plain number → assume CAD
    try:
        return f"CAD ${float(raw):.2f}"
    except ValueError:
        return raw
