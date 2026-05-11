from pydantic import BaseModel, Field
from models.project import MeasurementsUpdate, GlobalMeasurementSet

__all__ = ["GlobalMeasurementSetCreate", "GlobalMeasurementSet"]


class GlobalMeasurementSetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    measurements: MeasurementsUpdate = Field(default_factory=MeasurementsUpdate)
