from unittest.mock import patch, MagicMock
from scrapers.materials.the_fabric_club_scraper import search

MOCK_HTML = """
<html><body>
  <ol class="products-grid">
    <li class="item product product-item">
      <div class="product-image-container">
        <img class="product-image-photo" src="https://www.thefabricclub.ca/media/catalog/product/w/o/wool-tweed.jpg">
      </div>
      <strong class="product-item-name">
        <a class="product-item-link" href="https://www.thefabricclub.ca/en/wool-tweed-fabric.html">Wool Tweed Fabric</a>
      </strong>
      <div class="price-box">
        <span class="price-wrapper">
          <span class="price">$28.00</span>
        </span>
      </div>
    </li>
    <li class="item product product-item">
      <div class="product-image-container">
        <img class="product-image-photo" src="https://www.thefabricclub.ca/media/catalog/product/c/o/cotton-muslin.jpg">
      </div>
      <strong class="product-item-name">
        <a class="product-item-link" href="https://www.thefabricclub.ca/en/cotton-muslin.html">Cotton Muslin</a>
      </strong>
      <div class="price-box">
        <span class="price-wrapper">
          <span class="price">$13.00</span>
        </span>
      </div>
    </li>
  </ol>
</body></html>
"""


def _mock_resp(html=MOCK_HTML):
    mock = MagicMock()
    mock.text = html
    mock.raise_for_status = MagicMock()
    return mock


def test_returns_results():
    with patch("scrapers.materials.the_fabric_club_scraper.httpx.get", return_value=_mock_resp()):
        results = search("wool")
    assert len(results) == 2


def test_title_extracted():
    with patch("scrapers.materials.the_fabric_club_scraper.httpx.get", return_value=_mock_resp()):
        results = search("wool")
    assert results[0].title == "Wool Tweed Fabric"


def test_price_extracted():
    with patch("scrapers.materials.the_fabric_club_scraper.httpx.get", return_value=_mock_resp()):
        results = search("wool")
    assert results[0].price == "$28.00"


def test_image_url_extracted():
    with patch("scrapers.materials.the_fabric_club_scraper.httpx.get", return_value=_mock_resp()):
        results = search("wool")
    assert "wool-tweed.jpg" in results[0].image_url


def test_product_url_extracted():
    with patch("scrapers.materials.the_fabric_club_scraper.httpx.get", return_value=_mock_resp()):
        results = search("wool")
    assert results[0].url == "https://www.thefabricclub.ca/en/wool-tweed-fabric.html"


def test_source_is_the_fabric_club():
    with patch("scrapers.materials.the_fabric_club_scraper.httpx.get", return_value=_mock_resp()):
        results = search("wool")
    assert results[0].source == "the_fabric_club"


def test_empty_results():
    with patch("scrapers.materials.the_fabric_club_scraper.httpx.get", return_value=_mock_resp("<html><body></body></html>")):
        results = search("xyzzy")
    assert results == []
