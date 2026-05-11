from fastapi import APIRouter, HTTPException
from services import measurements_service
from models.measurement import GlobalMeasurementSetCreate, GlobalMeasurementSet

router = APIRouter()


@router.get("/", response_model=list[GlobalMeasurementSet])
def list_global_sets():
    return measurements_service.list_global_sets()


@router.post("/", response_model=GlobalMeasurementSet, status_code=201)
def create_global_set(data: GlobalMeasurementSetCreate):
    measurements = data.measurements.model_dump(exclude_none=True)
    return measurements_service.add_global_set(data.name, measurements)


@router.patch("/{ms_id}", response_model=GlobalMeasurementSet)
def update_global_set(ms_id: int, data: GlobalMeasurementSetCreate):
    measurements = data.measurements.model_dump(exclude_none=True)
    result = measurements_service.update_global_set(ms_id, data.name, measurements)
    if not result:
        raise HTTPException(status_code=404, detail="Measurement set not found")
    return result


@router.delete("/{ms_id}", status_code=204)
def delete_global_set(ms_id: int):
    measurements_service.delete_global_set(ms_id)
