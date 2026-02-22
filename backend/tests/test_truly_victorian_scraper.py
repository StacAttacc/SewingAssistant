from unittest.mock import patch, MagicMock
from bs4 import BeautifulSoup
from scrapers.patterns.truly_victorian_scraper import (
    search_patterns, scrape_pattern_detail, _extract_fabrics
)

MOCK_SEARCH_HTML = """
<html><body>
<ul class="products">
    <li class="product type-product">
        <a class="woocommerce-loop-product__link" href="https://trulyvictorian.info/shop/tv100/">
            <img src="https://trulyvictorian.info/wp-content/uploads/tv100.jpg" alt="TV100">
            <h2 class="woocommerce-loop-product__title">TV100 1880s Bustle Skirt</h2>
            <span class="price">
                <span class="woocommerce-Price-amount amount">
                    <bdi>$16.00</bdi>
                </span>
            </span>
        </a>
    </li>
    <li class="product type-product">
        <a class="woocommerce-loop-product__link" href="https://trulyvictorian.info/shop/tv200/">
            <img src="https://trulyvictorian.info/wp-content/uploads/tv200.jpg" alt="TV200">
            <h2 class="woocommerce-loop-product__title">TV200 1870s Bodice</h2>
            <span class="price">
                <span class="woocommerce-Price-amount amount">
                    <bdi>$14.00</bdi>
                </span>
            </span>
        </a>
    </li>
</ul>
</body></html>
"""

MOCK_DETAIL_HTML = """
<html><body>
<h1 class="product_title entry-title">TV100 1880s Bustle Skirt</h1>
<span class="sku">TV100</span>
<p class="price">
    <span class="woocommerce-Price-amount amount"><bdi>$16.00</bdi></span>
</p>
<div class="woocommerce-product-gallery">
    <img src="https://trulyvictorian.info/wp-content/uploads/tv100-main.jpg" alt="TV100">
</div>
<div class="woocommerce-product-details__short-description">
    <p>A beautiful bustle skirt pattern for the 1880s.</p>
    <ul>
        <li>4 yards of wool or cotton fabric</li>
        <li>2 yards of lining fabric</li>
        <li>Thread and hooks</li>
    </ul>
</div>
</body></html>
"""

MOCK_DETAIL_NO_FABRIC_HTML = """
<html><body>
<h1 class="product_title entry-title">TV300 Simple Apron</h1>
<div class="woocommerce-product-details__short-description">
    <p>An easy apron pattern suitable for beginners.</p>
</div>
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
    with patch("scrapers.patterns.truly_victorian_scraper.httpx.get", return_value=_mock_response(MOCK_SEARCH_HTML)):
        results = search_patterns("bustle skirt")
    assert len(results) == 2
    assert results[0].source == "truly_victorian"


def test_search_extracts_title():
    with patch("scrapers.patterns.truly_victorian_scraper.httpx.get", return_value=_mock_response(MOCK_SEARCH_HTML)):
        results = search_patterns("bustle skirt")
    assert results[0].title == "TV100 1880s Bustle Skirt"


def test_search_extracts_price():
    with patch("scrapers.patterns.truly_victorian_scraper.httpx.get", return_value=_mock_response(MOCK_SEARCH_HTML)):
        results = search_patterns("bustle skirt")
    assert results[0].price == "$16.00"


def test_search_extracts_image():
    with patch("scrapers.patterns.truly_victorian_scraper.httpx.get", return_value=_mock_response(MOCK_SEARCH_HTML)):
        results = search_patterns("bustle skirt")
    assert "tv100.jpg" in results[0].image_url


def test_search_sets_brand():
    with patch("scrapers.patterns.truly_victorian_scraper.httpx.get", return_value=_mock_response(MOCK_SEARCH_HTML)):
        results = search_patterns("bustle skirt")
    assert results[0].brand == "Truly Victorian"


def test_search_empty_page_returns_empty():
    with patch("scrapers.patterns.truly_victorian_scraper.httpx.get", return_value=_mock_response("<html></html>")):
        results = search_patterns("nothing")
    assert results == []


# --- scrape_pattern_detail ---

def test_detail_extracts_title():
    with patch("scrapers.patterns.truly_victorian_scraper.httpx.get", return_value=_mock_response(MOCK_DETAIL_HTML)):
        detail = scrape_pattern_detail("https://trulyvictorian.info/shop/tv100/")
    assert detail.title == "TV100 1880s Bustle Skirt"
    assert detail.source == "truly_victorian"


def test_detail_extracts_sku():
    with patch("scrapers.patterns.truly_victorian_scraper.httpx.get", return_value=_mock_response(MOCK_DETAIL_HTML)):
        detail = scrape_pattern_detail("https://trulyvictorian.info/shop/tv100/")
    assert detail.pattern_number == "TV100"


def test_detail_extracts_price():
    with patch("scrapers.patterns.truly_victorian_scraper.httpx.get", return_value=_mock_response(MOCK_DETAIL_HTML)):
        detail = scrape_pattern_detail("https://trulyvictorian.info/shop/tv100/")
    assert detail.price == "$16.00"


def test_detail_extracts_image():
    with patch("scrapers.patterns.truly_victorian_scraper.httpx.get", return_value=_mock_response(MOCK_DETAIL_HTML)):
        detail = scrape_pattern_detail("https://trulyvictorian.info/shop/tv100/")
    assert "tv100-main.jpg" in detail.image_url


def test_detail_extracts_fabrics():
    with patch("scrapers.patterns.truly_victorian_scraper.httpx.get", return_value=_mock_response(MOCK_DETAIL_HTML)):
        detail = scrape_pattern_detail("https://trulyvictorian.info/shop/tv100/")
    assert any("wool" in f.lower() for f in detail.fabric_recommendations)


def test_detail_sets_brand():
    with patch("scrapers.patterns.truly_victorian_scraper.httpx.get", return_value=_mock_response(MOCK_DETAIL_HTML)):
        detail = scrape_pattern_detail("https://trulyvictorian.info/shop/tv100/")
    assert detail.brand == "Truly Victorian"


# --- _extract_fabrics ---

def test_extract_fabrics_from_list():
    html = """
    <div>
        <ul>
            <li>4 yards of wool fabric</li>
            <li>Thread</li>
        </ul>
    </div>
    """
    el = BeautifulSoup(html, "html.parser").select_one("div")
    fabrics = _extract_fabrics(el)
    assert any("wool" in f.lower() for f in fabrics)


def test_extract_fabrics_from_paragraph():
    html = "<div><p>You will need cotton muslin for the lining.</p></div>"
    el = BeautifulSoup(html, "html.parser").select_one("div")
    fabrics = _extract_fabrics(el)
    assert len(fabrics) == 1


def test_extract_fabrics_no_fabric_mentions_returns_empty():
    html = "<div><p>Pattern includes instructions and diagrams.</p></div>"
    el = BeautifulSoup(html, "html.parser").select_one("div")
    assert _extract_fabrics(el) == []
