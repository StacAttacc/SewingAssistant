from unittest.mock import patch, MagicMock
from scrapers.patterns.simplicity_scraper import search_patterns, scrape_pattern_detail, _parse_description

DESCRIPTION_WITH_FABRICS_AND_NOTIONS = (
    "Flared cape has purchased ribbon ties. A: Hood and contrast lining. "
    "FABRICS: Lightweight Satin, Lightweight Broadcloth, Sheer Fabrics. "
    "NOTIONS: 1 yd of ribbon. Cape A: Seam Binding 1.5 yds. "
    "Size Combinations: (Small, Medium, Large, X-Large)"
)

MOCK_SEARCH_HTML = """
<html><body>
<article class="card viewBox" data-product-id="123">
    <figure class="card-figure">
        <a href="https://simplicity.com/simplicity/s9898" class="card-figure__link">
            <img src="https://cdn.example.com/s9898.jpg" alt="S9898">
        </a>
    </figure>
    <div class="card-body">
        <div class="card-b-up">
            <span class="productSku">S9898</span>
            <a class="card-title" href="https://simplicity.com/simplicity/s9898">
                Simplicity Easy Summer Dress
            </a>
            <div class="card-text" data-test-info-type="price">
                <s>$20.95</s><span>$14.67</span>
            </div>
        </div>
    </div>
</article>
</body></html>
"""

MOCK_DETAIL_HTML = """
<html><body>
<h1 class="productView-title">McCall's Cape Costume</h1>
<select id="attribute_select_1">
    <option value="">Choose Size:</option>
    <option value="1">S-M-L-XL</option>
</select>
<script type="application/ld+json">
{
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": "M4139",
    "sku": "M4139",
    "url": "https://simplicity.com/mccalls/m4139",
    "brand": {"@type": "Brand", "name": "McCall's"},
    "description": "Flared cape. FABRICS: Lightweight Satin, Broadcloth. NOTIONS: 1 yd ribbon. Size Combinations: S-M-L-XL",
    "image": "https://cdn.example.com/m4139.jpg",
    "offers": {"@type": "Offer", "price": "10.47", "priceCurrency": "USD"}
}
</script>
</body></html>
"""


def _mock_response(html: str, status: int = 200):
    mock = MagicMock()
    mock.text = html
    mock.status_code = status
    mock.raise_for_status = MagicMock()
    return mock


# --- _parse_description ---

def test_parse_description_extracts_fabrics():
    fabrics, _ = _parse_description(DESCRIPTION_WITH_FABRICS_AND_NOTIONS)
    assert "Lightweight Satin" in fabrics
    assert "Lightweight Broadcloth" in fabrics


def test_parse_description_extracts_notions():
    _, notions = _parse_description(DESCRIPTION_WITH_FABRICS_AND_NOTIONS)
    assert any("ribbon" in n.lower() for n in notions)


def test_parse_description_stops_at_size_combinations():
    fabrics, _ = _parse_description(DESCRIPTION_WITH_FABRICS_AND_NOTIONS)
    assert not any("Small" in f for f in fabrics)


def test_parse_description_empty():
    fabrics, notions = _parse_description("")
    assert fabrics == []
    assert notions == []


def test_parse_description_no_fabrics_section():
    fabrics, notions = _parse_description("Just a plain description with no labels.")
    assert fabrics == []
    assert notions == []


# --- search_patterns ---

def test_search_patterns_returns_results():
    with patch("scrapers.patterns.simplicity_scraper.httpx.get", return_value=_mock_response(MOCK_SEARCH_HTML)):
        results = search_patterns("summer dress")
    assert len(results) == 1
    assert results[0].pattern_number == "S9898"
    assert results[0].title == "Simplicity Easy Summer Dress"


def test_search_patterns_extracts_price():
    with patch("scrapers.patterns.simplicity_scraper.httpx.get", return_value=_mock_response(MOCK_SEARCH_HTML)):
        results = search_patterns("summer dress")
    assert results[0].price == "$14.67"


def test_search_patterns_extracts_image():
    with patch("scrapers.patterns.simplicity_scraper.httpx.get", return_value=_mock_response(MOCK_SEARCH_HTML)):
        results = search_patterns("summer dress")
    assert results[0].image_url == "https://cdn.example.com/s9898.jpg"


def test_search_patterns_detects_simplicity_brand():
    with patch("scrapers.patterns.simplicity_scraper.httpx.get", return_value=_mock_response(MOCK_SEARCH_HTML)):
        results = search_patterns("summer dress")
    assert results[0].brand == "Simplicity"


def test_search_patterns_empty_page():
    with patch("scrapers.patterns.simplicity_scraper.httpx.get", return_value=_mock_response("<html></html>")):
        results = search_patterns("xyznothing")
    assert results == []


# --- scrape_pattern_detail ---

def test_scrape_detail_extracts_title():
    with patch("scrapers.patterns.simplicity_scraper.httpx.get", return_value=_mock_response(MOCK_DETAIL_HTML)):
        detail = scrape_pattern_detail("https://simplicity.com/mccalls/m4139")
    assert detail.title == "McCall's Cape Costume"


def test_scrape_detail_extracts_sku():
    with patch("scrapers.patterns.simplicity_scraper.httpx.get", return_value=_mock_response(MOCK_DETAIL_HTML)):
        detail = scrape_pattern_detail("https://simplicity.com/mccalls/m4139")
    assert detail.pattern_number == "M4139"


def test_scrape_detail_extracts_price():
    with patch("scrapers.patterns.simplicity_scraper.httpx.get", return_value=_mock_response(MOCK_DETAIL_HTML)):
        detail = scrape_pattern_detail("https://simplicity.com/mccalls/m4139")
    assert detail.price == "10.47"


def test_scrape_detail_extracts_brand():
    with patch("scrapers.patterns.simplicity_scraper.httpx.get", return_value=_mock_response(MOCK_DETAIL_HTML)):
        detail = scrape_pattern_detail("https://simplicity.com/mccalls/m4139")
    assert detail.brand == "McCall's"


def test_scrape_detail_extracts_fabrics():
    with patch("scrapers.patterns.simplicity_scraper.httpx.get", return_value=_mock_response(MOCK_DETAIL_HTML)):
        detail = scrape_pattern_detail("https://simplicity.com/mccalls/m4139")
    assert "Lightweight Satin" in detail.fabric_recommendations


def test_scrape_detail_extracts_sizes():
    with patch("scrapers.patterns.simplicity_scraper.httpx.get", return_value=_mock_response(MOCK_DETAIL_HTML)):
        detail = scrape_pattern_detail("https://simplicity.com/mccalls/m4139")
    assert "S-M-L-XL" in detail.sizes


def test_scrape_detail_no_json_ld_returns_unknown():
    with patch("scrapers.patterns.simplicity_scraper.httpx.get", return_value=_mock_response("<html></html>")):
        detail = scrape_pattern_detail("https://simplicity.com/mccalls/m4139")
    assert detail.title == "Unknown"
