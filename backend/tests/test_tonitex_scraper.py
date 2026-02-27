from unittest.mock import patch, MagicMock
from scrapers.materials.tonitex_scraper import search

MOCK_HTML = """
<html><body>
  <article class="product-miniature js-product-miniature">
    <a class="thumbnail product-thumbnail" href="https://tonitex.com/en/fabric/12-cotton-lawn.html">
      <img src="https://tonitex.com/img/p/12-home_default/cotton-lawn.jpg">
    </a>
    <h3 class="h3 product-title"><a href="https://tonitex.com/en/fabric/12-cotton-lawn.html">Cotton Lawn Fabric</a></h3>
    <span class="price">$8.95</span>
  </article>
  <article class="product-miniature js-product-miniature">
    <a class="thumbnail product-thumbnail" href="https://tonitex.com/en/fabric/34-linen.html">
      <img src="https://tonitex.com/img/p/34-home_default/linen.jpg">
    </a>
    <h3 class="h3 product-title"><a href="https://tonitex.com/en/fabric/34-linen.html">Linen Fabric</a></h3>
    <span class="price">$12.50</span>
  </article>
</body></html>
"""


def _mock_resp(html=MOCK_HTML, status=200):
    mock = MagicMock()
    mock.text = html
    mock.raise_for_status = MagicMock()
    return mock


def test_returns_results():
    with patch("scrapers.materials._prestashop.httpx.get", return_value=_mock_resp()):
        results = search("cotton")
    assert len(results) == 2


def test_title_extracted():
    with patch("scrapers.materials._prestashop.httpx.get", return_value=_mock_resp()):
        results = search("cotton")
    assert results[0].title == "Cotton Lawn Fabric"


def test_price_extracted():
    with patch("scrapers.materials._prestashop.httpx.get", return_value=_mock_resp()):
        results = search("cotton")
    assert results[0].price == "$8.95"


def test_image_url_extracted():
    with patch("scrapers.materials._prestashop.httpx.get", return_value=_mock_resp()):
        results = search("cotton")
    assert "cotton-lawn.jpg" in results[0].image_url


def test_product_url_extracted():
    with patch("scrapers.materials._prestashop.httpx.get", return_value=_mock_resp()):
        results = search("cotton")
    assert results[0].url == "https://tonitex.com/en/fabric/12-cotton-lawn.html"


def test_source_is_tonitex():
    with patch("scrapers.materials._prestashop.httpx.get", return_value=_mock_resp()):
        results = search("cotton")
    assert results[0].source == "tonitex"


def test_empty_results():
    with patch("scrapers.materials._prestashop.httpx.get", return_value=_mock_resp("<html><body></body></html>")):
        results = search("xyzzy")
    assert results == []
