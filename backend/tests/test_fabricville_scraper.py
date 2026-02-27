from unittest.mock import patch, MagicMock
from scrapers.materials.fabricville_scraper import search

MOCK_SUGGEST = {
    "resources": {
        "results": {
            "products": [
                {
                    "title": "Cotton Poplin Fabric",
                    "url": "/products/cotton-poplin",
                    "image": "https://cdn.shopify.com/s/files/1/cotton-poplin.jpg",
                    "price": "12.99",
                },
                {
                    "title": "Denim Fabric",
                    "url": "/products/denim",
                    "image": "https://cdn.shopify.com/s/files/1/denim.jpg",
                    "price": "19.99",
                },
            ]
        }
    }
}


def _mock_resp(data=MOCK_SUGGEST):
    mock = MagicMock()
    mock.json.return_value = data
    mock.raise_for_status = MagicMock()
    return mock


def test_returns_results():
    with patch("scrapers.materials._shopify.httpx.get", return_value=_mock_resp()):
        results = search("cotton")
    assert len(results) == 2


def test_title_extracted():
    with patch("scrapers.materials._shopify.httpx.get", return_value=_mock_resp()):
        results = search("cotton")
    assert results[0].title == "Cotton Poplin Fabric"


def test_price_formatted_as_cad():
    with patch("scrapers.materials._shopify.httpx.get", return_value=_mock_resp()):
        results = search("cotton")
    assert results[0].price == "CAD $12.99"


def test_image_url_extracted():
    with patch("scrapers.materials._shopify.httpx.get", return_value=_mock_resp()):
        results = search("cotton")
    assert "cotton-poplin.jpg" in results[0].image_url


def test_relative_url_made_absolute():
    with patch("scrapers.materials._shopify.httpx.get", return_value=_mock_resp()):
        results = search("cotton")
    assert results[0].url == "https://fabricville.com/products/cotton-poplin"


def test_source_is_fabricville():
    with patch("scrapers.materials._shopify.httpx.get", return_value=_mock_resp()):
        results = search("cotton")
    assert results[0].source == "fabricville"


def test_empty_suggest_returns_empty_list():
    empty = {"resources": {"results": {"products": []}}}
    with patch("scrapers.materials._shopify.httpx.get", return_value=_mock_resp(empty)):
        results = search("xyzzy")
    assert results == []
