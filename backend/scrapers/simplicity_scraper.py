import json
import re
import httpx
from bs4 import BeautifulSoup
from models.pattern import PatternSearchResult, PatternDetail

SEARCH_URL = "https://simplicity.com/search.php"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

BRAND_MAP = {
    "/simplicity/": "Simplicity",
    "/mccalls/": "McCall's",
    "/vogue-patterns/": "Vogue",
    "/new-look/": "New Look",
    "/butterick/": "Butterick",
}


def _extract_brand(url: str) -> str:
    for path, brand in BRAND_MAP.items():
        if path in url:
            return brand
    return "Unknown"


def search_patterns(query: str, max_results: int = 10) -> list[PatternSearchResult]:
    """
    Search Simplicity's site directly using BS4.
    Covers Simplicity, McCall's, Vogue, Butterick, New Look — all on one site.
    No LLM needed.
    """
    resp = httpx.get(
        SEARCH_URL,
        params={"section": "product", "search_query": query},
        headers=HEADERS,
        timeout=15,
    )
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    cards = soup.select("article.card")[:max_results]

    results = []
    for card in cards:
        sku_el = card.select_one("span.productSku")
        title_el = card.select_one("a.card-title")
        price_el = card.select_one("div.card-text[data-test-info-type='price'] span:last-child")
        img_el = card.select_one("figure.card-figure img")

        if not title_el:
            continue

        url = title_el.get("href", "")
        results.append(PatternSearchResult(
            title=title_el.get_text(strip=True),
            pattern_number=sku_el.get_text(strip=True) if sku_el else None,
            brand=_extract_brand(url),
            price=price_el.get_text(strip=True) if price_el else None,
            image_url=img_el.get("src") if img_el else None,
            url=url,
        ))

    return results


def scrape_pattern_detail(url: str) -> PatternDetail:
    """
    Scrape a Simplicity pattern detail page.
    Extracts structured data from JSON-LD, then uses Groq only to parse
    the description string into fabrics and notions.
    """
    resp = httpx.get(url, headers=HEADERS, timeout=15)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")

    # Find the JSON-LD Product block
    ld_json = None
    for script in soup.select("script[type='application/ld+json']"):
        try:
            data = json.loads(script.string)
            if data.get("@type") == "Product":
                ld_json = data
                break
        except (json.JSONDecodeError, AttributeError):
            continue

    if not ld_json:
        return PatternDetail(title="Unknown", url=url)

    description = ld_json.get("description", "")
    price = str(ld_json.get("offers", {}).get("price", "")) or None
    image = ld_json.get("image")
    brand = ld_json.get("brand", {}).get("name")
    sku = ld_json.get("sku")

    title_el = soup.select_one("h1.productView-title")
    title = title_el.get_text(strip=True) if title_el else ld_json.get("name", "")

    # Sizes come from the dropdown options
    size_options = soup.select("select[id^='attribute_select'] option:not([value=''])")
    sizes = ", ".join(o.get_text(strip=True) for o in size_options) or None

    fabrics, notions = _parse_description(description)

    return PatternDetail(
        title=title,
        pattern_number=sku,
        brand=brand,
        price=price,
        image_url=image,
        sizes=sizes,
        fabric_recommendations=fabrics,
        notions=notions,
        url=url,
    )


def _parse_description(description: str) -> tuple[list[str], list[str]]:
    """
    Extract fabrics and notions from the Simplicity description using regex.
    The format is consistent: uppercase labels FABRICS: and NOTIONS: are always present.
    No LLM needed — completely free.
    """
    if not description:
        return [], []

    fabrics: list[str] = []
    notions: list[str] = []

    fabrics_match = re.search(
        r'FABRICS:\s*(.+?)(?=NOTIONS:|Size Combinations:|$)',
        description,
        re.IGNORECASE | re.DOTALL,
    )
    if fabrics_match:
        fabrics = [
            f.strip().rstrip('.')
            for f in re.split(r',\s*', fabrics_match.group(1))
            if f.strip() and len(f.strip()) > 2
        ]

    notions_match = re.search(
        r'NOTIONS:\s*(.+?)(?=Size Combinations:|$)',
        description,
        re.IGNORECASE | re.DOTALL,
    )
    if notions_match:
        notions = [
            n.strip()
            for n in re.split(r'\.\s+', notions_match.group(1))
            if n.strip() and len(n.strip()) > 2
        ]

    return fabrics, notions
