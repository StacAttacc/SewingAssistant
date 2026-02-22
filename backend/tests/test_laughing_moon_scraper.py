from unittest.mock import patch, MagicMock
from scrapers.patterns.laughing_moon_scraper import search_patterns

MOCK_DDG_RESULTS = [
    {
        "title": "Pattern #100 Victorian Bodice - Laughing Moon Mercantile",
        "href": "https://www.laughingmoonmercantile.com/product-page/pattern-100",
        "body": "An 1870s fitted bodice pattern with full instructions.",
    },
    {
        "title": "Pattern #200 Civil War Hoop Skirt - Laughing Moon Mercantile",
        "href": "https://www.laughingmoonmercantile.com/product-page/pattern-200",
        "body": "A period-accurate hoop skirt pattern.",
    },
]


def _mock_ddgs(results):
    mock_ddgs = MagicMock()
    mock_ddgs.__enter__ = MagicMock(return_value=mock_ddgs)
    mock_ddgs.__exit__ = MagicMock(return_value=False)
    mock_ddgs.text = MagicMock(return_value=results)
    return mock_ddgs


def test_search_returns_results():
    with patch("scrapers.patterns.laughing_moon_scraper.DDGS", return_value=_mock_ddgs(MOCK_DDG_RESULTS)):
        results = search_patterns("victorian bodice")
    assert len(results) == 2


def test_search_extracts_title():
    with patch("scrapers.patterns.laughing_moon_scraper.DDGS", return_value=_mock_ddgs(MOCK_DDG_RESULTS)):
        results = search_patterns("victorian bodice")
    assert "Victorian Bodice" in results[0].title


def test_search_extracts_url():
    with patch("scrapers.patterns.laughing_moon_scraper.DDGS", return_value=_mock_ddgs(MOCK_DDG_RESULTS)):
        results = search_patterns("victorian bodice")
    assert "laughingmoonmercantile.com" in results[0].url


def test_search_sets_brand():
    with patch("scrapers.patterns.laughing_moon_scraper.DDGS", return_value=_mock_ddgs(MOCK_DDG_RESULTS)):
        results = search_patterns("victorian bodice")
    assert results[0].brand == "Laughing Moon Mercantile"


def test_search_empty_results_returns_empty():
    with patch("scrapers.patterns.laughing_moon_scraper.DDGS", return_value=_mock_ddgs([])):
        results = search_patterns("nothing")
    assert results == []


def test_search_skips_results_without_url():
    bad_results = [{"title": "Something", "href": "", "body": "..."}]
    with patch("scrapers.patterns.laughing_moon_scraper.DDGS", return_value=_mock_ddgs(bad_results)):
        results = search_patterns("something")
    assert results == []
