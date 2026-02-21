from fastapi import FastAPI
from database import init_db
from api.patterns import router as patterns_router
from api.stores import router as stores_router
from api.projects import router as projects_router

app = FastAPI(title="Sewing Assistant API")

app.include_router(patterns_router, prefix="/api/patterns", tags=["patterns"])
app.include_router(stores_router, prefix="/api/stores", tags=["stores"])
app.include_router(projects_router, prefix="/api/projects", tags=["projects"])


@app.on_event("startup")
def startup():
    init_db()


@app.get("/")
def root():
    return {"status": "ok"}
