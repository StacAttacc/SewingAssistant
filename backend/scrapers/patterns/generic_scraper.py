import re
import httpx
from bs4 import BeautifulSoup
from models.pattern import PatternDetail

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

# Common price formats: $12.00, £8.50, €10,00, 12.50
_PRICE_RE = re.compile(r"[\$£€]\s*\d+[\.,]\d{2}|\d+[\.,]\d{2}\s*[\$£€]")


def scrape_from_url(url: str) -> PatternDetail:
    """
    Generic fallback scraper for any pattern page.
    Extracts title, price, and image on a best-effort basis.
    """
    resp = httpx.get(url, headers=HEADERS, timeout=15, follow_redirects=True)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")

    title = _extract_title(soup)
    price = _extract_price(soup)
    image_url = _extract_image(soup, url)

    return PatternDetail(
        source="custom",
        title=title,
        url=url,
        price=price,
        image_url=image_url,
    )


def _extract_title(soup: BeautifulSoup) -> str:
    # Prefer the first h1, then og:title meta, then <title>
    h1 = soup.find("h1")
    if h1 and h1.get_text(strip=True):
        return h1.get_text(strip=True)

    og_title = soup.find("meta", property="og:title")
    if og_title and og_title.get("content", "").strip():
        return og_title["content"].strip()

    if soup.title and soup.title.string:
        return soup.title.string.strip()

    return "Unknown"


def _extract_price(soup: BeautifulSoup) -> str | None:
    # Try og:price first (common in e-commerce)
    for name in ("product:price:amount", "og:price:amount"):
        meta = soup.find("meta", property=name)
        if meta and meta.get("content"):
            currency_meta = soup.find("meta", property=name.replace("amount", "currency"))
            currency = currency_meta["content"] if currency_meta else ""
            return f"{meta['content']} {currency}".strip()

    # Walk the page text looking for price patterns
    for el in soup.find_all(string=_PRICE_RE):
        match = _PRICE_RE.search(el)
        if match:
            return match.group(0).strip()

    return None


def _extract_image(soup: BeautifulSoup, page_url: str) -> str | None:
    # og:image is the most reliable
    og_image = soup.find("meta", property="og:image")
    if og_image and og_image.get("content"):
        return og_image["content"]

    # First <img> with a meaningful src (not icons/logos/tracking pixels)
    for img in soup.find_all("img", src=True):
        src = img["src"]
        if src.startswith("data:") or len(src) < 10:
            continue
        if any(skip in src.lower() for skip in ("logo", "icon", "pixel", "track", "badge")):
            continue
        # Resolve relative URLs
        if src.startswith("//"):
            return "https:" + src
        if src.startswith("/"):
            from urllib.parse import urlparse
            parsed = urlparse(page_url)
            return f"{parsed.scheme}://{parsed.netloc}{src}"
        return src

    return None
