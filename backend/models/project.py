from pydantic import BaseModel


# --- Request models (what the client sends) ---

class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    budget: float | None = None


class ChecklistItemCreate(BaseModel):
    title: str
    notes: str = ""


class ProjectPatternSave(BaseModel):
    """Save a pattern (from any scraper) to a project."""
    source: str = ""
    title: str = ""
    url: str
    image_url: str | None = None
    price: str | None = None


class ProjectMaterialCreate(BaseModel):
    name: str
    quantity: str = ""
    notes: str = ""


# --- Response models (what the API returns) ---

class Project(BaseModel):
    id: int
    name: str
    description: str
    budget: float | None
    status: str
    created_at: str


class ChecklistItem(BaseModel):
    id: int
    project_id: int
    title: str
    notes: str
    checked: int  # 0 or 1
    created_at: str


class ProjectPattern(BaseModel):
    id: int
    project_id: int
    source: str
    title: str
    url: str
    image_url: str | None
    price: str | None
    saved_at: str


class ProjectMaterial(BaseModel):
    id: int
    project_id: int
    name: str
    quantity: str
    notes: str
    purchased: int  # 0 or 1
    created_at: str


class ProjectDetail(BaseModel):
    """Full project with all nested data — returned by GET /projects/{id}."""
    id: int
    name: str
    description: str
    budget: float | None
    status: str
    created_at: str
    patterns: list[ProjectPattern]
    materials: list[ProjectMaterial]
    checklist: list[ChecklistItem]
