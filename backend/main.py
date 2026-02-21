from fastapi import FastAPI
from api.patterns import router as patterns_router
from api.stores import router as stores_router

app = FastAPI(title="Sewing Assistant API")

app.include_router(patterns_router, prefix="/api/patterns", tags=["patterns"])
app.include_router(stores_router, prefix="/api/stores", tags=["stores"])


@app.get("/")
def root():
    return {"status": "ok"}
