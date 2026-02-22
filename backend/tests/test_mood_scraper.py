from unittest.mock import patch, MagicMock
from scrapers.patterns.mood_scraper import search_patterns, scrape_pattern_detail, _extract_materials
from bs4 import BeautifulSoup

MOCK_SEARCH_HTML = """
<html><body>
<article>
    <h2><a href="https://blog.moodfabrics.com/peak-pencil-skirt-free-sewing-pattern/">
        The Peak Pencil Skirt Free Sewing Pattern
    </a></h2>
    <img src="https://blog.moodfabrics.com/wp-content/uploads/2024/skirt.jpg" alt="pencil skirt">
</article>
<article>
    <h2><a href="https://blog.moodfabrics.com/easy-summer-dress-pattern/">
        Easy Summer Dress Pattern
    </a></h2>
    <img src="https://blog.moodfabrics.com/wp-content/uploads/2024/dress.jpg" alt="summer dress">
</article>
</body></html>
"""

MOCK_DETAIL_HTML = """
<html><body>
<article>
<h1>The Peak Pencil Skirt Free Sewing Pattern</h1>
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "BlogPosting",
            "headline": "The Peak Pencil Skirt Free Sewing Pattern",
            "image": {"@type": "ImageObject", "url": "https://blog.moodfabrics.com/wp-content/uploads/2024/skirt.jpg"},
            "url": "https://blog.moodfabrics.com/peak-pencil-skirt-free-sewing-pattern/"
        }
    ]
}
</script>
<div class="entry-content">
    <h3>Essential Materials &amp; Sizing Guide</h3>
    <ul>
        <li>1.5 yards of brushed wool blend twill</li>
        <li>1.5 yards of stretch polyester twill lining</li>
        <li>YKK invisible zipper</li>
    </ul>
</div>
</article>
</body></html>
"""

MOCK_DETAIL_NO_JSON_LD = """
<html><body>
<h1>Some Pattern Without JSON-LD</h1>
<div class="entry-content"><p>No structured data here.</p></div>
</body></html>
"""


def _mock_response(html: str, status: int = 200):
    mock = MagicMock()
    mock.text = html
    mock.status_code = status
    mock.raise_for_status = MagicMock()
    return mock


# --- search_patterns ---

def test_search_returns_results():
    with patch("scrapers.patterns.mood_scraper.httpx.get", return_value=_mock_response(MOCK_SEARCH_HTML)):
        results = search_patterns("pencil skirt")
    assert len(results) == 2


def test_search_extracts_title():
    with patch("scrapers.patterns.mood_scraper.httpx.get", return_value=_mock_response(MOCK_SEARCH_HTML)):
        results = search_patterns("pencil skirt")
    assert results[0].title == "The Peak Pencil Skirt Free Sewing Pattern"


def test_search_extracts_url():
    with patch("scrapers.patterns.mood_scraper.httpx.get", return_value=_mock_response(MOCK_SEARCH_HTML)):
        results = search_patterns("pencil skirt")
    assert "peak-pencil-skirt" in results[0].url


def test_search_extracts_image():
    with patch("scrapers.patterns.mood_scraper.httpx.get", return_value=_mock_response(MOCK_SEARCH_HTML)):
        results = search_patterns("pencil skirt")
    assert results[0].image_url == "https://blog.moodfabrics.com/wp-content/uploads/2024/skirt.jpg"


def test_search_sets_brand():
    with patch("scrapers.patterns.mood_scraper.httpx.get", return_value=_mock_response(MOCK_SEARCH_HTML)):
        results = search_patterns("pencil skirt")
    assert results[0].brand == "Mood Fabrics"


def test_search_empty_page_returns_empty():
    with patch("scrapers.patterns.mood_scraper.httpx.get", return_value=_mock_response("<html></html>")):
        results = search_patterns("nothing")
    assert results == []


# --- scrape_pattern_detail ---

def test_detail_extracts_title():
    with patch("scrapers.patterns.mood_scraper.httpx.get", return_value=_mock_response(MOCK_DETAIL_HTML)):
        detail = scrape_pattern_detail("https://blog.moodfabrics.com/peak-pencil-skirt-free-sewing-pattern/")
    assert detail.title == "The Peak Pencil Skirt Free Sewing Pattern"


def test_detail_extracts_image():
    with patch("scrapers.patterns.mood_scraper.httpx.get", return_value=_mock_response(MOCK_DETAIL_HTML)):
        detail = scrape_pattern_detail("https://blog.moodfabrics.com/peak-pencil-skirt-free-sewing-pattern/")
    assert "skirt.jpg" in detail.image_url


def test_detail_sets_brand():
    with patch("scrapers.patterns.mood_scraper.httpx.get", return_value=_mock_response(MOCK_DETAIL_HTML)):
        detail = scrape_pattern_detail("https://blog.moodfabrics.com/peak-pencil-skirt-free-sewing-pattern/")
    assert detail.brand == "Mood Fabrics"


def test_detail_extracts_fabrics():
    with patch("scrapers.patterns.mood_scraper.httpx.get", return_value=_mock_response(MOCK_DETAIL_HTML)):
        detail = scrape_pattern_detail("https://blog.moodfabrics.com/peak-pencil-skirt-free-sewing-pattern/")
    assert any("wool" in f.lower() for f in detail.fabric_recommendations)
    assert any("zipper" in f.lower() for f in detail.fabric_recommendations)


def test_detail_no_json_ld_falls_back_to_h1():
    with patch("scrapers.patterns.mood_scraper.httpx.get", return_value=_mock_response(MOCK_DETAIL_NO_JSON_LD)):
        detail = scrape_pattern_detail("https://blog.moodfabrics.com/some-pattern/")
    assert detail.title == "Some Pattern Without JSON-LD"


# --- _extract_materials ---

def test_extract_materials_from_ul():
    html = """
    <div class="entry-content">
        <h3>Essential Materials</h3>
        <ul><li>Cotton fabric</li><li>Thread</li></ul>
    </div>
    """
    el = BeautifulSoup(html, "html.parser").select_one("div.entry-content")
    materials = _extract_materials(el)
    assert "Cotton fabric" in materials
    assert "Thread" in materials


def test_extract_materials_from_paragraph():
    html = """
    <div class="entry-content">
        <h3>What You Need</h3>
        <p>2 yards of linen, matching thread, buttons</p>
    </div>
    """
    el = BeautifulSoup(html, "html.parser").select_one("div.entry-content")
    materials = _extract_materials(el)
    assert len(materials) == 1
    assert "linen" in materials[0]


def test_extract_materials_no_section_returns_empty():
    html = "<div class='entry-content'><p>Just a description.</p></div>"
    el = BeautifulSoup(html, "html.parser").select_one("div.entry-content")
    assert _extract_materials(el) == []
