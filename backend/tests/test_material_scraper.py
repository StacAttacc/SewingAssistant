from unittest.mock import patch
from scrapers.material_scraper import search_materials

MOCK_RESULT = [{"title": "Fabric Store", "href": "https://example.com", "body": "Buy here"}]


def test_search_materials_searches_each_material():
    with patch("scrapers.material_scraper.DDGS") as mock_ddgs:
        mock_instance = mock_ddgs.return_value.__enter__.return_value
        mock_instance.text.return_value = MOCK_RESULT

        search_materials(["cotton fabric", "invisible zipper"])

        assert mock_instance.text.call_count == 2


def test_search_materials_tags_each_result_with_material_name():
    with patch("scrapers.material_scraper.DDGS") as mock_ddgs:
        mock_ddgs.return_value.__enter__.return_value.text.return_value = MOCK_RESULT

        results = search_materials(["cotton fabric"])

    assert results[0]["material"] == "cotton fabric"


def test_search_materials_returns_all_results_across_materials():
    with patch("scrapers.material_scraper.DDGS") as mock_ddgs:
        mock_ddgs.return_value.__enter__.return_value.text.return_value = MOCK_RESULT

        results = search_materials(["cotton fabric", "invisible zipper"])

    # 1 result per material × 2 materials
    assert len(results) == 2


def test_search_materials_empty_list():
    results = search_materials([])
    assert results == []
