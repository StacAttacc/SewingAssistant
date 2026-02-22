from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app
from models.pattern import PatternDetail

client = TestClient(app)

MOCK_DETAIL = PatternDetail(
    source="truly_victorian",
    title="TV100 1880s Bustle Skirt",
    pattern_number="TV100",
    brand="Truly Victorian",
    price="$16.00",
    image_url="https://trulyvictorian.info/tv100.jpg",
    url="https://trulyvictorian.info/shop/tv100/",
    fabric_recommendations=["4 yards of wool fabric", "2 yards of lining fabric"],
    notions=["Thread and hooks"],
)

MOCK_CUSTOM_DETAIL = PatternDetail(
    source="custom",
    title="Amazing Corset Pattern",
    price="$18.00",
    image_url="https://corsetsrus.com/images/corset.jpg",
    url="https://corsetsrus.com/pattern/corset",
)

MOCK_PURCHASE_LINKS = [
    {"material": "wool fabric", "store": "Mood Fabrics", "url": "https://moodfabrics.com", "snippet": "Fine wool"},
    {"material": "lining fabric", "store": "Fabric.com", "url": "https://fabric.com", "snippet": "Polyester lining"},
    {"material": "Thread and hooks", "store": "Joann", "url": "https://joann.com", "snippet": "Sewing notions"},
]


# --- POST /patterns/from-url (known host) ---

def test_from_url_known_host_uses_dedicated_scraper():
    with patch("api.patterns.truly_victorian_scraper.scrape_pattern_detail", return_value=MOCK_DETAIL):
        resp = client.post("/api/patterns/from-url", json={"url": "https://trulyvictorian.info/shop/tv100/"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "TV100 1880s Bustle Skirt"
    assert data["source"] == "truly_victorian"


def test_from_url_unknown_host_uses_generic_scraper():
    with patch("api.patterns.generic_scraper.scrape_from_url", return_value=MOCK_CUSTOM_DETAIL):
        resp = client.post("/api/patterns/from-url", json={"url": "https://corsetsrus.com/pattern/corset"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["source"] == "custom"
    assert data["title"] == "Amazing Corset Pattern"


def test_from_url_empty_url_returns_400():
    resp = client.post("/api/patterns/from-url", json={"url": ""})
    assert resp.status_code == 400


def test_from_url_missing_url_returns_422():
    resp = client.post("/api/patterns/from-url", json={})
    assert resp.status_code == 422


# --- POST /patterns/materials ---

def test_materials_returns_pattern_and_purchase_links():
    with patch("api.patterns.truly_victorian_scraper.scrape_pattern_detail", return_value=MOCK_DETAIL):
        with patch("api.patterns.search_materials", return_value=MOCK_PURCHASE_LINKS):
            resp = client.post("/api/patterns/materials", json={"url": "https://trulyvictorian.info/shop/tv100/"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["pattern"]["title"] == "TV100 1880s Bustle Skirt"
    assert len(data["purchase_links"]) == 3


def test_materials_passes_all_fabrics_and_notions_to_search():
    """Confirms both fabric_recommendations and notions are searched."""
    captured = {}
    def capture_search(materials):
        captured["materials"] = materials
        return []

    with patch("api.patterns.truly_victorian_scraper.scrape_pattern_detail", return_value=MOCK_DETAIL):
        with patch("api.patterns.search_materials", side_effect=capture_search):
            client.post("/api/patterns/materials", json={"url": "https://trulyvictorian.info/shop/tv100/"})

    assert "4 yards of wool fabric" in captured["materials"]
    assert "Thread and hooks" in captured["materials"]


def test_materials_no_materials_skips_search():
    """If the pattern has no fabric or notions, search_materials is not called."""
    bare_detail = PatternDetail(
        source="custom", title="Plain Pattern", url="https://example.com/plain"
    )
    with patch("api.patterns.generic_scraper.scrape_from_url", return_value=bare_detail):
        with patch("api.patterns.search_materials") as mock_search:
            resp = client.post("/api/patterns/materials", json={"url": "https://example.com/plain"})
    assert resp.status_code == 200
    mock_search.assert_not_called()
    assert resp.json()["purchase_links"] == []


def test_materials_empty_url_returns_400():
    resp = client.post("/api/patterns/materials", json={"url": ""})
    assert resp.status_code == 400
