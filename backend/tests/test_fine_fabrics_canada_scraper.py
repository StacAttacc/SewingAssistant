from unittest.mock import patch, MagicMock
from scrapers.materials.fine_fabrics_canada_scraper import search

MOCK_HTML = """
<html><body>
  <article class="product-miniature js-product-miniature">
    <a class="thumbnail product-thumbnail" href="https://finefabricscanada.com/en/fabric/5-silk-charmeuse.html">
      <img src="https://finefabricscanada.com/img/p/5-home_default/silk.jpg">
    </a>
    <h3 class="h3 product-title"><a href="https://finefabricscanada.com/en/fabric/5-silk-charmeuse.html">Silk Charmeuse</a></h3>
    <span class="price">$38.00</span>
  </article>
</body></html>
"""


def _mock_resp(html=MOCK_HTML):
    mock = MagicMock()
    mock.text = html
    mock.raise_for_status = MagicMock()
    return mock


def test_returns_results():
    with patch("scrapers.materials._prestashop.httpx.get", return_value=_mock_resp()):
        results = search("silk")
    assert len(results) == 1


def test_source_is_fine_fabrics_canada():
    with patch("scrapers.materials._prestashop.httpx.get", return_value=_mock_resp()):
        results = search("silk")
    assert results[0].source == "fine_fabrics_canada"


def test_title_and_price():
    with patch("scrapers.materials._prestashop.httpx.get", return_value=_mock_resp()):
        results = search("silk")
    assert results[0].title == "Silk Charmeuse"
    assert results[0].price == "$38.00"


def test_product_url_is_absolute():
    with patch("scrapers.materials._prestashop.httpx.get", return_value=_mock_resp()):
        results = search("silk")
    assert results[0].url.startswith("https://")
