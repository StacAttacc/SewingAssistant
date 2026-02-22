import httpx
from bs4 import BeautifulSoup
from models.pattern import PatternSearchResult, PatternDetail

BASE_URL = "https://trulyvictorian.info"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}


def search_patterns(query: str, max_results: int = 10) -> list[PatternSearchResult]:
    """
    Search Truly Victorian using WordPress/WooCommerce product search.
    Uses the standard ?s=query&post_type=product URL pattern.
    """
    resp = httpx.get(
        BASE_URL + "/",
        params={"s": query, "post_type": "product"},
        headers=HEADERS,
        timeout=15,
    )
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    return _parse_product_list(soup, max_results)


def scrape_pattern_detail(url: str) -> PatternDetail:
    """
    Scrape a Truly Victorian product page.
    Uses standard WooCommerce HTML selectors.
    """
    resp = httpx.get(url, headers=HEADERS, timeout=15)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")

    title_el = soup.select_one("h1.product_title") or soup.select_one("h1.entry-title")
    price_el = soup.select_one("p.price .woocommerce-Price-amount bdi")
    img_el = soup.select_one("div.woocommerce-product-gallery img")
    desc_el = soup.select_one("div.woocommerce-product-details__short-description") or \
              soup.select_one("div#tab-description")
    sku_el = soup.select_one("span.sku")

    title = title_el.get_text(strip=True) if title_el else "Unknown"
    price = price_el.get_text(strip=True) if price_el else None
    image_url = img_el.get("src") if img_el else None
    sku = sku_el.get_text(strip=True) if sku_el else None

    fabrics = _extract_fabrics(desc_el) if desc_el else []

    return PatternDetail(
        source="truly_victorian",
        title=title,
        pattern_number=sku,
        brand="Truly Victorian",
        price=price,
        image_url=image_url,
        fabric_recommendations=fabrics,
        url=url,
    )


def _parse_product_list(soup: BeautifulSoup, max_results: int) -> list[PatternSearchResult]:
    """Extract product cards from a WooCommerce product listing page."""
    products = soup.select("ul.products li.product")[:max_results]
    results = []

    for product in products:
        link_el = product.select_one("a.woocommerce-loop-product__link")
        title_el = product.select_one(".woocommerce-loop-product__title")
        price_el = product.select_one(".price .woocommerce-Price-amount bdi")
        img_el = product.select_one("img")

        if not link_el or not title_el:
            continue

        results.append(PatternSearchResult(
            source="truly_victorian",
            title=title_el.get_text(strip=True),
            brand="Truly Victorian",
            price=price_el.get_text(strip=True) if price_el else None,
            image_url=img_el.get("src") if img_el else None,
            url=link_el.get("href", ""),
        ))

    return results


def _extract_fabrics(desc_el) -> list[str]:
    """
    Extract fabric recommendations from WooCommerce product description.
    Looks for list items or paragraphs that mention fabric types.
    """
    FABRIC_KEYWORDS = ("fabric", "wool", "cotton", "silk", "linen", "muslin", "velvet", "taffeta")
    candidates = []

    for li in desc_el.select("li"):
        text = li.get_text(strip=True)
        if any(kw in text.lower() for kw in FABRIC_KEYWORDS):
            candidates.append(text)

    if not candidates:
        for p in desc_el.select("p"):
            text = p.get_text(strip=True)
            if any(kw in text.lower() for kw in FABRIC_KEYWORDS):
                candidates.append(text)

    return candidates
