from unittest.mock import patch, MagicMock
from scrapers.patterns.generic_scraper import scrape_from_url

# --- Mock HTML fixtures ---

MOCK_FULL_HTML = """
<html>
<head>
    <title>Amazing Corset Pattern - CorsetsRUs</title>
    <meta property="og:image" content="https://corsetsrus.com/images/corset.jpg">
</head>
<body>
    <h1>Amazing Corset Pattern</h1>
    <span class="price">$18.00</span>
</body>
</html>
"""

MOCK_NO_H1_HTML = """
<html>
<head>
    <title>Mystery Pattern | SewingShop</title>
    <meta property="og:title" content="Mystery Pattern">
</head>
<body>
    <p>Some description here.</p>
</body>
</html>
"""

MOCK_MINIMAL_HTML = """
<html><head><title>Just a Page</title></head><body></body></html>
"""

MOCK_OG_PRICE_HTML = """
<html>
<head>
    <title>Linen Shirt Pattern</title>
    <meta property="product:price:amount" content="14.99">
    <meta property="product:price:currency" content="USD">
    <meta property="og:image" content="https://example.com/shirt.jpg">
</head>
<body><h1>Linen Shirt Pattern</h1></body>
</html>
"""

MOCK_RELATIVE_IMG_HTML = """
<html>
<head><title>Pattern with relative image</title></head>
<body>
    <h1>Vintage Blouse Pattern</h1>
    <img src="/images/blouse.jpg" alt="blouse">
</body>
</html>
"""


def _mock_response(html: str, status: int = 200):
    mock = MagicMock()
    mock.text = html
    mock.status_code = status
    mock.raise_for_status = MagicMock()
    return mock


# --- title extraction ---

def test_extracts_h1_as_title():
    with patch("scrapers.patterns.generic_scraper.httpx.get", return_value=_mock_response(MOCK_FULL_HTML)):
        result = scrape_from_url("https://corsetsrus.com/pattern/corset")
    assert result.title == "Amazing Corset Pattern"


def test_falls_back_to_og_title():
    with patch("scrapers.patterns.generic_scraper.httpx.get", return_value=_mock_response(MOCK_NO_H1_HTML)):
        result = scrape_from_url("https://sewingshop.com/mystery")
    assert result.title == "Mystery Pattern"


def test_falls_back_to_title_tag():
    with patch("scrapers.patterns.generic_scraper.httpx.get", return_value=_mock_response(MOCK_MINIMAL_HTML)):
        result = scrape_from_url("https://example.com/page")
    assert result.title == "Just a Page"


# --- price extraction ---

def test_extracts_price_from_text():
    with patch("scrapers.patterns.generic_scraper.httpx.get", return_value=_mock_response(MOCK_FULL_HTML)):
        result = scrape_from_url("https://corsetsrus.com/pattern/corset")
    assert result.price == "$18.00"


def test_extracts_price_from_og_meta():
    with patch("scrapers.patterns.generic_scraper.httpx.get", return_value=_mock_response(MOCK_OG_PRICE_HTML)):
        result = scrape_from_url("https://example.com/shirt")
    assert "14.99" in result.price


def test_no_price_returns_none():
    with patch("scrapers.patterns.generic_scraper.httpx.get", return_value=_mock_response(MOCK_MINIMAL_HTML)):
        result = scrape_from_url("https://example.com/page")
    assert result.price is None


# --- image extraction ---

def test_extracts_og_image():
    with patch("scrapers.patterns.generic_scraper.httpx.get", return_value=_mock_response(MOCK_FULL_HTML)):
        result = scrape_from_url("https://corsetsrus.com/pattern/corset")
    assert result.image_url == "https://corsetsrus.com/images/corset.jpg"


def test_resolves_relative_image_url():
    with patch("scrapers.patterns.generic_scraper.httpx.get", return_value=_mock_response(MOCK_RELATIVE_IMG_HTML)):
        result = scrape_from_url("https://example.com/pattern")
    assert result.image_url == "https://example.com/images/blouse.jpg"


def test_no_image_returns_none():
    with patch("scrapers.patterns.generic_scraper.httpx.get", return_value=_mock_response(MOCK_MINIMAL_HTML)):
        result = scrape_from_url("https://example.com/page")
    assert result.image_url is None


# --- source and url ---

def test_source_is_custom():
    with patch("scrapers.patterns.generic_scraper.httpx.get", return_value=_mock_response(MOCK_FULL_HTML)):
        result = scrape_from_url("https://corsetsrus.com/pattern/corset")
    assert result.source == "custom"


def test_url_is_preserved():
    with patch("scrapers.patterns.generic_scraper.httpx.get", return_value=_mock_response(MOCK_FULL_HTML)):
        result = scrape_from_url("https://corsetsrus.com/pattern/corset")
    assert result.url == "https://corsetsrus.com/pattern/corset"
