from unittest.mock import patch, MagicMock
from scrapers.patterns.black_snail_scraper import (
    search_patterns, scrape_pattern_detail, list_free_patterns, _handle_from_url
)

MOCK_PRODUCTS_JSON = {
    "products": [
        {
            "title": "TV101 Visiting Dress 1872",
            "handle": "tv101-visiting-dress",
            "vendor": "Black Snail Patterns",
            "product_type": "PDF",
            "tags": ["1860-1910", "dress", "victorian"],
            "variants": [{"price": "12.50"}],
            "images": [{"src": "https://cdn.shopify.com/tv101.jpg"}],
        },
        {
            "title": "TV201 Working Man Trousers 1880",
            "handle": "tv201-trousers",
            "vendor": "Black Snail Patterns",
            "product_type": "PDF",
            "tags": ["1860-1910", "men", "trousers"],
            "variants": [{"price": "10.00"}],
            "images": [{"src": "https://cdn.shopify.com/tv201.jpg"}],
        },
    ]
}

MOCK_FREE_JSON = {
    "products": [
        {
            "title": "Free Corset Pattern",
            "handle": "free-corset",
            "vendor": "Black Snail Patterns",
            "product_type": "PDF",
            "tags": ["free", "corset"],
            "variants": [{"price": "0.00"}],
            "images": [{"src": "https://cdn.shopify.com/corset.jpg"}],
        }
    ]
}

MOCK_PRODUCT_JSON = {
    "product": {
        "title": "TV101 Visiting Dress 1872",
        "handle": "tv101-visiting-dress",
        "vendor": "Black Snail Patterns",
        "product_type": "PDF",
        "tags": ["1860-1910", "dress"],
        "variants": [{"price": "12.50"}],
        "images": [{"src": "https://cdn.shopify.com/tv101.jpg"}],
    }
}


def _mock_response(data: dict, status: int = 200):
    mock = MagicMock()
    mock.json.return_value = data
    mock.status_code = status
    mock.raise_for_status = MagicMock()
    return mock


# --- search_patterns ---

def test_search_matches_by_title():
    with patch("scrapers.patterns.black_snail_scraper.httpx.get", return_value=_mock_response(MOCK_PRODUCTS_JSON)):
        results = search_patterns("dress")
    assert len(results) == 1
    assert "Visiting Dress" in results[0].title
    assert results[0].source == "black_snail"


def test_search_matches_by_tag():
    with patch("scrapers.patterns.black_snail_scraper.httpx.get", return_value=_mock_response(MOCK_PRODUCTS_JSON)):
        results = search_patterns("men")
    assert len(results) == 1
    assert "Trousers" in results[0].title


def test_search_extracts_price():
    with patch("scrapers.patterns.black_snail_scraper.httpx.get", return_value=_mock_response(MOCK_PRODUCTS_JSON)):
        results = search_patterns("dress")
    assert results[0].price == "12.50"


def test_search_extracts_image():
    with patch("scrapers.patterns.black_snail_scraper.httpx.get", return_value=_mock_response(MOCK_PRODUCTS_JSON)):
        results = search_patterns("dress")
    assert "tv101.jpg" in results[0].image_url


def test_search_sets_brand():
    with patch("scrapers.patterns.black_snail_scraper.httpx.get", return_value=_mock_response(MOCK_PRODUCTS_JSON)):
        results = search_patterns("dress")
    assert results[0].brand == "Black Snail Patterns"


def test_search_no_match_returns_empty():
    with patch("scrapers.patterns.black_snail_scraper.httpx.get", return_value=_mock_response(MOCK_PRODUCTS_JSON)):
        results = search_patterns("wedding")
    assert results == []


# --- list_free_patterns ---

def test_list_free_returns_results():
    with patch("scrapers.patterns.black_snail_scraper.httpx.get", return_value=_mock_response(MOCK_FREE_JSON)):
        results = list_free_patterns()
    assert len(results) == 1
    assert results[0].title == "Free Corset Pattern"


# --- scrape_pattern_detail ---

def test_detail_extracts_title():
    with patch("scrapers.patterns.black_snail_scraper.httpx.get", return_value=_mock_response(MOCK_PRODUCT_JSON)):
        detail = scrape_pattern_detail("https://blacksnailpatterns.com/products/tv101-visiting-dress")
    assert detail.title == "TV101 Visiting Dress 1872"
    assert detail.source == "black_snail"


def test_detail_extracts_price():
    with patch("scrapers.patterns.black_snail_scraper.httpx.get", return_value=_mock_response(MOCK_PRODUCT_JSON)):
        detail = scrape_pattern_detail("https://blacksnailpatterns.com/products/tv101-visiting-dress")
    assert detail.price == "12.50"


def test_detail_extracts_image():
    with patch("scrapers.patterns.black_snail_scraper.httpx.get", return_value=_mock_response(MOCK_PRODUCT_JSON)):
        detail = scrape_pattern_detail("https://blacksnailpatterns.com/products/tv101-visiting-dress")
    assert "tv101.jpg" in detail.image_url


def test_detail_missing_product_returns_unknown():
    with patch("scrapers.patterns.black_snail_scraper.httpx.get", return_value=_mock_response({"product": None})):
        detail = scrape_pattern_detail("https://blacksnailpatterns.com/products/missing")
    assert detail.title == "Unknown"


# --- _handle_from_url ---

def test_handle_from_url():
    assert _handle_from_url("https://blacksnailpatterns.com/products/tv101-visiting-dress") == "tv101-visiting-dress"


def test_handle_from_url_with_trailing_slash():
    assert _handle_from_url("https://blacksnailpatterns.com/products/tv101-visiting-dress/") == "tv101-visiting-dress"
