"""Shared helper for PrestaShop classic-theme stores (Tonitex, Fine Fabrics Canada)."""
import httpx
from bs4 import BeautifulSoup
from models.material import FabricSearchResult

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}


def search(base_url: str, source: str, query: str, max_results: int = 10) -> list[FabricSearchResult]:
    url = f"{base_url}/en/search?controller=search&s={query}"
    resp = httpx.get(url, headers=HEADERS, timeout=15, follow_redirects=True)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    results = []

    for card in soup.select(".product-miniature")[:max_results]:
        title_el = card.select_one(".product-title a, .product-name a")
        price_el = card.select_one("span.price")
        img_el = card.select_one("img")

        if not title_el:
            continue

        title = title_el.get_text(strip=True)
        price = price_el.get_text(strip=True) if price_el else None
        image_url = img_el.get("src") or img_el.get("data-src") if img_el else None
        href = title_el.get("href")
        product_url = href if href and href.startswith("http") else f"{base_url}{href}" if href else ""

        results.append(FabricSearchResult(
            source=source,
            title=title,
            price=price,
            image_url=image_url,
            url=product_url,
        ))

    return results
