from unittest.mock import patch, MagicMock
from scrapers.materials.cleanersupply_scraper import search

MOCK_DDG_RESULTS = [
    {"title": "Sewing Thread | Cleanersupply.ca", "href": "https://www.cleanersupply.ca/tailoring-and-sewing-supplies/sewing-thread/", "body": "Wide range of sewing thread"},
    {"title": "Tailoring Supplies | Cleanersupply.ca", "href": "https://www.cleanersupply.ca/tailoring-and-sewing-supplies/", "body": "Tailoring essentials"},
]


def test_returns_results():
    mock_ddgs = MagicMock()
    mock_ddgs.__enter__.return_value.text.return_value = MOCK_DDG_RESULTS
    with patch("scrapers.materials.cleanersupply_scraper.DDGS", return_value=mock_ddgs):
        results = search("thread")
    assert len(results) == 2


def test_title_extracted():
    mock_ddgs = MagicMock()
    mock_ddgs.__enter__.return_value.text.return_value = MOCK_DDG_RESULTS
    with patch("scrapers.materials.cleanersupply_scraper.DDGS", return_value=mock_ddgs):
        results = search("thread")
    assert results[0].title == "Sewing Thread | Cleanersupply.ca"


def test_url_extracted():
    mock_ddgs = MagicMock()
    mock_ddgs.__enter__.return_value.text.return_value = MOCK_DDG_RESULTS
    with patch("scrapers.materials.cleanersupply_scraper.DDGS", return_value=mock_ddgs):
        results = search("thread")
    assert "cleanersupply.ca" in results[0].url


def test_source_is_cleanersupply():
    mock_ddgs = MagicMock()
    mock_ddgs.__enter__.return_value.text.return_value = MOCK_DDG_RESULTS
    with patch("scrapers.materials.cleanersupply_scraper.DDGS", return_value=mock_ddgs):
        results = search("thread")
    assert results[0].source == "cleanersupply"


def test_price_is_none():
    mock_ddgs = MagicMock()
    mock_ddgs.__enter__.return_value.text.return_value = MOCK_DDG_RESULTS
    with patch("scrapers.materials.cleanersupply_scraper.DDGS", return_value=mock_ddgs):
        results = search("thread")
    assert results[0].price is None


def test_empty_results():
    mock_ddgs = MagicMock()
    mock_ddgs.__enter__.return_value.text.return_value = []
    with patch("scrapers.materials.cleanersupply_scraper.DDGS", return_value=mock_ddgs):
        results = search("xyzzy")
    assert results == []


def test_searches_with_site_operator():
    mock_ddgs = MagicMock()
    mock_instance = mock_ddgs.__enter__.return_value
    mock_instance.text.return_value = []
    with patch("scrapers.materials.cleanersupply_scraper.DDGS", return_value=mock_ddgs):
        search("thread")
    call_args = mock_instance.text.call_args[0][0]
    assert "site:cleanersupply.ca" in call_args
    assert "thread" in call_args
