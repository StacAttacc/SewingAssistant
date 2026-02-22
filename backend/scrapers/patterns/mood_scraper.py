import json
import httpx
from bs4 import BeautifulSoup, Tag
from models.pattern import PatternSearchResult, PatternDetail

BASE_URL = "https://blog.moodfabrics.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

MATERIAL_KEYWORDS = ("material", "fabric", "supply", "supplies", "you'll need", "you need", "what you need")


def search_patterns(query: str, max_results: int = 10) -> list[PatternSearchResult]:
    """
    Search the Mood Fabrics blog for free sewing patterns.
    Uses WordPress built-in search (?s=query).
    """
    resp = httpx.get(BASE_URL + "/", params={"s": query}, headers=HEADERS, timeout=15)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    articles = soup.select("article")[:max_results]

    results = []
    for article in articles:
        title_el = article.select_one("h2 a") or article.select_one("h1 a")
        img_el = article.select_one("img")

        if not title_el:
            continue

        results.append(PatternSearchResult(
            title=title_el.get_text(strip=True),
            brand="Mood Fabrics",
            image_url=img_el.get("src") if img_el else None,
            url=title_el.get("href", ""),
        ))

    return results


def scrape_pattern_detail(url: str) -> PatternDetail:
    """
    Scrape a Mood Fabrics blog post for pattern details.
    Uses JSON-LD BlogPosting for title and image.
    Extracts fabric/material recommendations from the post body.
    Note: PDF patterns require email signup — we surface the post URL only.
    """
    resp = httpx.get(url, headers=HEADERS, timeout=15)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")

    ld_json = _find_blog_posting(soup)

    if not ld_json:
        title_el = soup.select_one("h1")
        return PatternDetail(
            title=title_el.get_text(strip=True) if title_el else "Unknown",
            brand="Mood Fabrics",
            url=url,
        )

    title = ld_json.get("headline", "Unknown")
    image = ld_json.get("image")
    image_url = image.get("url") if isinstance(image, dict) else image if isinstance(image, str) else None

    content_el = soup.select_one("div.entry-content") or soup.select_one("article")
    fabrics = _extract_materials(content_el) if content_el else []

    return PatternDetail(
        title=title,
        brand="Mood Fabrics",
        image_url=image_url,
        fabric_recommendations=fabrics,
        url=url,
    )


def _find_blog_posting(soup: BeautifulSoup) -> dict | None:
    """Find the BlogPosting JSON-LD block on a Mood Fabrics post page."""
    for script in soup.select("script[type='application/ld+json']"):
        try:
            data = json.loads(script.string)
            # JSON-LD can be a single object or a list (@graph)
            items = data if isinstance(data, list) else data.get("@graph", [data])
            for item in items:
                if item.get("@type") == "BlogPosting":
                    return item
        except (json.JSONDecodeError, AttributeError):
            continue
    return None


def _extract_materials(content_el: Tag) -> list[str]:
    """
    Extract fabric/material recommendations from the post body.
    Looks for headings that mention materials, then reads the following list or paragraph.
    """
    for heading in content_el.select("h2, h3, h4"):
        if any(kw in heading.get_text(strip=True).lower() for kw in MATERIAL_KEYWORDS):
            sibling = heading.find_next_sibling()
            if sibling and sibling.name in ("ul", "ol"):
                return [li.get_text(strip=True) for li in sibling.select("li") if li.get_text(strip=True)]
            if sibling and sibling.name == "p":
                return [sibling.get_text(strip=True)]
    return []
