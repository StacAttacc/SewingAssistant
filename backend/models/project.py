from pydantic import BaseModel, Field


# --- Request models (what the client sends) ---


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    budget: float | None = None
    global_measurement_set_ids: list[int] = []


class ProjectUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    budget: float | None = None


class ChecklistItemCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    notes: str = Field(default="", max_length=2000)


class ChecklistItemUpdate(BaseModel):
    title: str = Field(default="", max_length=500)
    notes: str = Field(default="", max_length=2000)
    image_urls: list[str] = []


class ChecklistReorder(BaseModel):
    ids: list[int]


class ProjectPatternSave(BaseModel):
    """Save a pattern (from any scraper) to a project."""

    source: str = Field(default="", max_length=100)
    title: str = Field(default="", max_length=500)
    url: str = Field(min_length=1)
    image_url: str | None = None
    price: str | None = None
    notes: str | None = None


class ProjectMaterialCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    quantity: str = Field(default="", max_length=100)
    notes: str = Field(default="", max_length=2000)
    image_url: str | None = None
    price: float | None = None
    care_instructions: str | None = None
    grain_direction: str | None = None
    pre_wash: int = 0


class ProjectMaterialUpdate(BaseModel):
    purchased: int
    price: float | None = None
    quantity: str | None = None


class ProjectMaterialFullEdit(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    quantity: str = Field(default="", max_length=100)
    notes: str = Field(default="", max_length=2000)
    image_url: str | None = None
    price: float | None = None
    care_instructions: str | None = None
    grain_direction: str | None = None
    pre_wash: int = 0


class MeasurementsUpdate(BaseModel):
    ankle:                float | None = None
    biceps:               float | None = None
    bustFront:            float | None = None
    bustPointToUnderbust: float | None = None
    bustSpan:             float | None = None
    chest:                float | None = None
    crossSeam:            float | None = None
    crossSeamFront:       float | None = None
    crotchDepth:          float | None = None
    head:                 float | None = None
    heel:                 float | None = None
    highBust:             float | None = None
    highBustFront:        float | None = None
    hips:                 float | None = None
    hpsToBust:            float | None = None
    hpsToWaistBack:       float | None = None
    hpsToWaistFront:      float | None = None
    inseam:               float | None = None
    knee:                 float | None = None
    neck:                 float | None = None
    seat:                 float | None = None
    seatBack:             float | None = None
    shoulderSlope:        float | None = None
    shoulderToElbow:      float | None = None
    shoulderToShoulder:   float | None = None
    shoulderToWrist:      float | None = None
    underbust:            float | None = None
    upperLeg:             float | None = None
    waist:                float | None = None
    waistBack:            float | None = None
    waistToArmpit:        float | None = None
    waistToFloor:         float | None = None
    waistToHips:          float | None = None
    waistToKnee:          float | None = None
    waistToSeat:          float | None = None
    waistToUnderbust:     float | None = None
    waistToUpperLeg:      float | None = None
    wrist:                float | None = None


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


class ProjectStatusUpdate(BaseModel):
    status: str  # 'to_start' | 'in_progress' | 'on_hold' | 'completed'


class Project(BaseModel):
    id: int
    name: str
    description: str
    budget: float | None
    status: str = 'to_start'
    created_at: str


class ChecklistItem(BaseModel):
    id: int
    project_id: int
    title: str
    notes: str
    checked: int  # 0 or 1
    image_urls: list[str] = []
    position: int = 0
    created_at: str


class ProjectPattern(BaseModel):
    id: int
    project_id: int
    source: str
    title: str
    url: str
    image_url: str | None
    price: str | None
    notes: str | None = None
    saved_at: str


class ProjectMaterial(BaseModel):
    id: int
    project_id: int
    name: str
    quantity: str
    notes: str
    purchased: int  # 0 or 1
    price: float | None = None
    image_url: str | None = None
    care_instructions: str | None = None
    grain_direction: str | None = None
    pre_wash: int = 0
    created_at: str


class ProjectMeasurementSetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    measurements: MeasurementsUpdate = Field(default_factory=MeasurementsUpdate)


class ProjectMeasurementSet(BaseModel):
    id: int
    project_id: int
    name: str
    measurements: dict
    created_at: str


class GlobalMeasurementSet(BaseModel):
    id: int
    name: str
    measurements: dict
    created_at: str


class ProjectProgressImage(BaseModel):
    id: int
    project_id: int
    url: str
    created_at: str


class ProjectDetail(BaseModel):
    id: int
    name: str
    description: str
    budget: float | None
    created_at: str
    patterns: list[ProjectPattern]
    materials: list[ProjectMaterial]
    checklist: list[ChecklistItem]
    measurement_sets: list[ProjectMeasurementSet]
    global_measurement_sets: list[GlobalMeasurementSet] = []
    progress_images: list[ProjectProgressImage] = []
