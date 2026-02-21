"""
Quick test script for the scrapers.
Run with: uv run python test_scrapers.py
"""

import json
from scrapers.pattern_scraper import search_patterns
from scrapers.material_scraper import search_materials


def pretty(data):
    print(json.dumps(data, indent=2))


if __name__ == "__main__":
    print("\n=== Test 1: Search for patterns ===")
    results = search_patterns("women's summer dress easy")
    pretty(results)

    print("\n=== Test 2: Search for materials ===")
    materials = search_materials(["cotton fabric", "invisible zipper"])
    pretty(materials)
