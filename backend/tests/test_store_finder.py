from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from services.store_finder import find_nearby_stores

MOCK_ELEMENTS = [
    {
        "tags": {
            "name": "Fabric World",
            "addr:housenumber": "12",
            "addr:street": "Main St",
            "addr:city": "Springfield",
            "phone": "555-1234",
            "website": "https://fabricworld.example.com",
            "opening_hours": "Mo-Sa 09:00-18:00",
        },
        "lat": 51.5,
        "lon": -0.1,
    }
]


def _make_mock_response(elements):
    resp = MagicMock()
    resp.json.return_value = {"elements": elements}
    resp.raise_for_status = MagicMock()
    return resp


@pytest.mark.asyncio
async def test_find_nearby_stores_returns_formatted_results():
    with patch("services.store_finder.httpx.AsyncClient") as mock_client:
        mock_client.return_value.__aenter__.return_value.post = AsyncMock(
            return_value=_make_mock_response(MOCK_ELEMENTS)
        )
        results = await find_nearby_stores(51.5, -0.1)

    assert len(results) == 1
    assert results[0]["name"] == "Fabric World"
    assert results[0]["lat"] == 51.5
    assert results[0]["lon"] == -0.1
    assert results[0]["phone"] == "555-1234"
    assert results[0]["website"] == "https://fabricworld.example.com"


@pytest.mark.asyncio
async def test_find_nearby_stores_builds_address():
    with patch("services.store_finder.httpx.AsyncClient") as mock_client:
        mock_client.return_value.__aenter__.return_value.post = AsyncMock(
            return_value=_make_mock_response(MOCK_ELEMENTS)
        )
        results = await find_nearby_stores(51.5, -0.1)

    assert "Main St" in results[0]["address"]
    assert "Springfield" in results[0]["address"]


@pytest.mark.asyncio
async def test_find_nearby_stores_empty_response():
    with patch("services.store_finder.httpx.AsyncClient") as mock_client:
        mock_client.return_value.__aenter__.return_value.post = AsyncMock(
            return_value=_make_mock_response([])
        )
        results = await find_nearby_stores(51.5, -0.1)

    assert results == []


@pytest.mark.asyncio
async def test_find_nearby_stores_missing_name_fallback():
    elements = [{"tags": {}, "lat": 51.5, "lon": -0.1}]
    with patch("services.store_finder.httpx.AsyncClient") as mock_client:
        mock_client.return_value.__aenter__.return_value.post = AsyncMock(
            return_value=_make_mock_response(elements)
        )
        results = await find_nearby_stores(51.5, -0.1)

    assert results[0]["name"] == "Unnamed store"
