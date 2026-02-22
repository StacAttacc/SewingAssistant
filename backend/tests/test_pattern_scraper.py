from unittest.mock import patch, MagicMock
from scrapers.pattern_scraper import search_patterns

MOCK_DDG_RESULTS = [
    {"title": "Simplicity 9898 Easy Dress", "href": "https://simplicity.com/9898", "body": "Easy summer dress pattern"},
    {"title": "McCall's M8000 Dress", "href": "https://mccall.com/m8000", "body": "Casual dress"},
]

MOCK_LLM_RESPONSE = '[{"title": "Simplicity 9898 Easy Dress", "pattern_number": "S9898", "brand": "Simplicity", "difficulty": "Easy", "url": "https://simplicity.com/9898"}]'


def _mock_groq(content):
    mock = MagicMock()
    mock.choices[0].message.content = content
    return mock


def test_search_patterns_returns_structured_results():
    with patch("scrapers.pattern_scraper.DDGS") as mock_ddgs, \
         patch("scrapers.pattern_scraper._client") as mock_client:
        mock_ddgs.return_value.__enter__.return_value.text.return_value = MOCK_DDG_RESULTS
        mock_client.chat.completions.create.return_value = _mock_groq(MOCK_LLM_RESPONSE)

        results = search_patterns("summer dress easy")

    assert len(results) == 1
    assert results[0]["pattern_number"] == "S9898"
    assert results[0]["brand"] == "Simplicity"


def test_search_patterns_includes_query_in_search():
    with patch("scrapers.pattern_scraper.DDGS") as mock_ddgs, \
         patch("scrapers.pattern_scraper._client"):
        mock_ddgs.return_value.__enter__.return_value.text.return_value = []
        search_patterns("blazer women")
        call_args = mock_ddgs.return_value.__enter__.return_value.text.call_args

    assert "blazer women" in call_args[0][0]


def test_search_patterns_empty_results_skips_llm():
    with patch("scrapers.pattern_scraper.DDGS") as mock_ddgs, \
         patch("scrapers.pattern_scraper._client") as mock_client:
        mock_ddgs.return_value.__enter__.return_value.text.return_value = []

        results = search_patterns("xyznonexistent")

    assert results == []
    mock_client.chat.completions.create.assert_not_called()


def test_search_patterns_falls_back_on_bad_llm_json():
    with patch("scrapers.pattern_scraper.DDGS") as mock_ddgs, \
         patch("scrapers.pattern_scraper._client") as mock_client:
        mock_ddgs.return_value.__enter__.return_value.text.return_value = MOCK_DDG_RESULTS
        mock_client.chat.completions.create.return_value = _mock_groq("not valid json")

        results = search_patterns("dress")

    assert len(results) == 2
    assert results[0]["url"] == "https://simplicity.com/9898"


def test_search_patterns_respects_max_results():
    with patch("scrapers.pattern_scraper.DDGS") as mock_ddgs, \
         patch("scrapers.pattern_scraper._client"):
        mock_ddgs.return_value.__enter__.return_value.text.return_value = []
        search_patterns("dress", max_results=3)
        call_args = mock_ddgs.return_value.__enter__.return_value.text.call_args

    assert call_args[1]["max_results"] == 3
