from scrapers.materials import (
    tonitex_scraper,
    fabricville_scraper,
    spool_of_thread_scraper,
    fine_fabrics_canada_scraper,
    the_fabric_club_scraper,
    cleanersupply_scraper,
)
from models.material import FabricSearchResult

SCRAPERS = {
    "tonitex": tonitex_scraper,
    "fabricville": fabricville_scraper,
    "spool_of_thread": spool_of_thread_scraper,
    "fine_fabrics_canada": fine_fabrics_canada_scraper,
    "the_fabric_club": the_fabric_club_scraper,
    "cleanersupply": cleanersupply_scraper,
}


def search_fabrics(query: str, source: str) -> list[FabricSearchResult]:
    scraper = SCRAPERS.get(source)
    if not scraper:
        raise ValueError(f"Unknown source '{source}'. Valid: {list(SCRAPERS)}")
    return scraper.search(query)


def list_sources() -> list[str]:
    return list(SCRAPERS)
