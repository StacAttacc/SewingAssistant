from unittest.mock import patch
from scrapers.pattern_scraper import search_patterns

MOCK_RESULTS = [
    {"title": "Simplicity 9898 Easy Dress", "href": "https://simplicity.com/9898", "body": "Easy summer dress pattern"},
    {"title": "McCall's M8000 Dress", "href": "https://mccall.com/m8000", "body": "Casual dress"},
]


def test_search_patterns_returns_formatted_results():
    with patch("scrapers.pattern_scraper.DDGS") as mock_ddgs:
        mock_ddgs.return_value.__enter__.return_value.text.return_value = MOCK_RESULTS
        results = search_patterns("summer dress easy")

    assert len(results) == 2
    assert results[0]["title"] == "Simplicity 9898 Easy Dress"
    assert results[0]["url"] == "https://simplicity.com/9898"
    assert results[0]["snippet"] == "Easy summer dress pattern"


def test_search_patterns_includes_query_in_search():
    with patch("scrapers.pattern_scraper.DDGS") as mock_ddgs:
        mock_ddgs.return_value.__enter__.return_value.text.return_value = []
        search_patterns("blazer women")
        call_args = mock_ddgs.return_value.__enter__.return_value.text.call_args

    assert "blazer women" in call_args[0][0]


def test_search_patterns_empty_results():
    with patch("scrapers.pattern_scraper.DDGS") as mock_ddgs:
        mock_ddgs.return_value.__enter__.return_value.text.return_value = []
        results = search_patterns("xyznonexistent")

    assert results == []


def test_search_patterns_respects_max_results():
    with patch("scrapers.pattern_scraper.DDGS") as mock_ddgs:
        mock_ddgs.return_value.__enter__.return_value.text.return_value = []
        search_patterns("dress", max_results=3)
        call_args = mock_ddgs.return_value.__enter__.return_value.text.call_args

    assert call_args[1]["max_results"] == 3
