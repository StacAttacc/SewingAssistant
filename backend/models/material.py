from pydantic import BaseModel


class FabricSearchResult(BaseModel):
    """Normalized result from any fabric/accessories store."""
    source: str
    title: str
    price: str | None = None
    image_url: str | None = None
    url: str
