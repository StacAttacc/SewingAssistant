import httpx

OVERPASS_URL = "https://overpass-api.de/api/interpreter"


async def find_nearby_stores(lat: float, lon: float, radius_m: int = 10000) -> list[dict]:
    """Find nearby fabric/sewing stores using OpenStreetMap Overpass API (free, no key needed)."""

    # Query for shops tagged as fabric, sewing, or craft stores
    query = f"""
    [out:json][timeout:25];
    (
        node["shop"="fabric"](around:{radius_m},{lat},{lon});
        node["shop"="sewing"](around:{radius_m},{lat},{lon});
        node["craft"="sewing"](around:{radius_m},{lat},{lon});
        node["shop"="craft"](around:{radius_m},{lat},{lon});
    );
    out body;
    """

    async with httpx.AsyncClient() as client:
        resp = await client.post(OVERPASS_URL, data={"data": query}, timeout=30)
        resp.raise_for_status()

    elements = resp.json().get("elements", [])
    return [
        {
            "name": el.get("tags", {}).get("name", "Unnamed store"),
            "address": _build_address(el.get("tags", {})),
            "lat": el.get("lat"),
            "lon": el.get("lon"),
            "phone": el.get("tags", {}).get("phone"),
            "website": el.get("tags", {}).get("website"),
            "opening_hours": el.get("tags", {}).get("opening_hours"),
        }
        for el in elements
    ]


def _build_address(tags: dict) -> str:
    parts = [
        tags.get("addr:housenumber", ""),
        tags.get("addr:street", ""),
        tags.get("addr:city", ""),
        tags.get("addr:postcode", ""),
    ]
    return ", ".join(p for p in parts if p) or "Address not available"
