from unittest.mock import patch, MagicMock
from scrapers.materials.spool_of_thread_scraper import search

MOCK_SUGGEST = {
    "resources": {
        "results": {
            "products": [
                {
                    "title": "Organic Cotton Jersey",
                    "url": "/products/organic-cotton-jersey",
                    "image": "https://cdn.shopify.com/s/files/1/jersey.jpg",
                    "price": "8.50",
                }
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
        results = search("jersey")
    assert len(results) == 1


def test_source_is_spool_of_thread():
    with patch("scrapers.materials._shopify.httpx.get", return_value=_mock_resp()):
        results = search("jersey")
    assert results[0].source == "spool_of_thread"


def test_title_and_price():
    with patch("scrapers.materials._shopify.httpx.get", return_value=_mock_resp()):
        results = search("jersey")
    assert results[0].title == "Organic Cotton Jersey"
    assert results[0].price == "CAD $8.50"


def test_url_is_absolute():
    with patch("scrapers.materials._shopify.httpx.get", return_value=_mock_resp()):
        results = search("jersey")
    assert results[0].url == "https://spoolofthread.com/products/organic-cotton-jersey"
