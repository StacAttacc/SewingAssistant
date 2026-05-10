from pydantic import BaseModel, Field


# --- Request models (what the client sends) ---


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    budget: float | None = None


class ChecklistItemCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    notes: str = Field(default="", max_length=2000)


class ProjectPatternSave(BaseModel):
    """Save a pattern (from any scraper) to a project."""

    source: str = Field(default="", max_length=100)
    title: str = Field(default="", max_length=500)
    url: str = Field(min_length=1)
    image_url: str | None = None
    price: str | None = None


class ProjectMaterialCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    quantity: str = Field(default="", max_length=100)
    notes: str = Field(default="", max_length=2000)
    image_url: str | None = None


class MeasurementsUpdate(BaseModel):
    waist: float | None = None
    hips: float | None = None
    height: float | None = None
    bust: float | None = None


class SkirtMeasurements(BaseModel):
    waist: float = 70.0
    hips: float = 92.0


class SkirtStyleParams(BaseModel):
    length: float = 60.0
    flare: float = Field(default=0.3, ge=0.0, le=1.0)
    num_panels: int = Field(default=4, ge=2, le=12)
    waistband_width: float = Field(default=4.0, gt=0.0)


class GeneratePatternRequest(BaseModel):
    garment_type: str  # "skirt" (others later)
    measurements: SkirtMeasurements = Field(default_factory=SkirtMeasurements)
    style_params: SkirtStyleParams = Field(default_factory=SkirtStyleParams)


# --- Response models (what the API returns) ---


class Project(BaseModel):
    id: int
    name: str
    description: str
    budget: float | None
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
    image_url: str | None = None
    created_at: str


class ProjectDetail(BaseModel):
    """Full project with all nested data — returned by GET /projects/{id}."""

    id: int
    name: str
    description: str
    budget: float | None
    measurements: dict | None = None
    created_at: str
    patterns: list[ProjectPattern]
    materials: list[ProjectMaterial]
    checklist: list[ChecklistItem]
