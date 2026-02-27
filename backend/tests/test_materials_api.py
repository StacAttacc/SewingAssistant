from unittest.mock import patch
from fastapi.testclient import TestClient
from main import app
from models.material import FabricSearchResult

client = TestClient(app)

MOCK_RESULTS = [
    FabricSearchResult(
        source="fabricville",
        title="Cotton Poplin Fabric",
        price="CAD $12.99",
        image_url="https://cdn.shopify.com/s/files/1/cotton.jpg",
        url="https://fabricville.com/products/cotton-poplin",
    ),
    FabricSearchResult(
        source="fabricville",
        title="Denim Fabric",
        price="CAD $19.99",
        image_url="https://cdn.shopify.com/s/files/1/denim.jpg",
        url="https://fabricville.com/products/denim",
    ),
]


# --- GET /materials/sources ---

def test_list_sources_returns_all_stores():
    resp = client.get("/api/materials/sources")
    assert resp.status_code == 200
    sources = resp.json()["sources"]
    assert "fabricville" in sources
    assert "tonitex" in sources
    assert "spool_of_thread" in sources
    assert "fine_fabrics_canada" in sources
    assert "the_fabric_club" in sources
    assert "cleanersupply" in sources


# --- POST /materials/search ---

def test_search_returns_results():
    with patch("api.materials.material_service.search_fabrics", return_value=MOCK_RESULTS):
        resp = client.post("/api/materials/search", json={"query": "cotton", "source": "fabricville"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert data[0]["title"] == "Cotton Poplin Fabric"


def test_search_empty_query_returns_400():
    resp = client.post("/api/materials/search", json={"query": "", "source": "fabricville"})
    assert resp.status_code == 400


def test_search_missing_query_returns_422():
    resp = client.post("/api/materials/search", json={"source": "fabricville"})
    assert resp.status_code == 422


def test_search_missing_source_returns_422():
    resp = client.post("/api/materials/search", json={"query": "cotton"})
    assert resp.status_code == 422


def test_search_unknown_source_returns_400():
    resp = client.post("/api/materials/search", json={"query": "cotton", "source": "nonexistent"})
    assert resp.status_code == 400
    assert "Unknown source" in resp.json()["detail"]


def test_search_result_has_normalized_fields():
    with patch("api.materials.material_service.search_fabrics", return_value=MOCK_RESULTS):
        resp = client.post("/api/materials/search", json={"query": "cotton", "source": "fabricville"})
    item = resp.json()[0]
    assert "source" in item
    assert "title" in item
    assert "price" in item
    assert "image_url" in item
    assert "url" in item
