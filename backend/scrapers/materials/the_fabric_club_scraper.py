import httpx
from bs4 import BeautifulSoup
from models.material import FabricSearchResult

BASE_URL = "https://www.thefabricclub.ca"
SOURCE = "the_fabric_club"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}


def search(query: str, max_results: int = 10) -> list[FabricSearchResult]:
    """Search The Fabric Club (Magento 2, membership-based Montreal retailer)."""
    url = f"{BASE_URL}/en/search?q={query}"
    resp = httpx.get(url, headers=HEADERS, timeout=15, follow_redirects=True)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    results = []

    for card in soup.select("li.item.product.product-item")[:max_results]:
        title_el = card.select_one("strong.product-item-name a.product-item-link")
        price_el = card.select_one("span.price-wrapper span.price")
        img_el = card.select_one("img.product-image-photo")

        if not title_el:
            continue

        title = title_el.get_text(strip=True)
        price = price_el.get_text(strip=True) if price_el else None
        image_url = img_el.get("src") or img_el.get("data-src") if img_el else None
        href = title_el.get("href", "")
        product_url = href if href.startswith("http") else f"{BASE_URL}{href}"

        results.append(FabricSearchResult(
            source=SOURCE,
            title=title,
            price=price,
            image_url=image_url,
            url=product_url,
        ))

    return results
