from contextlib import asynccontextmanager
from fastapi import FastAPI
from database import init_db
from api.patterns import router as patterns_router
from api.stores import router as stores_router
from api.projects import router as projects_router
from api.materials import router as materials_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Sewing Assistant API", lifespan=lifespan)

app.include_router(patterns_router, prefix="/api/patterns", tags=["patterns"])
app.include_router(stores_router, prefix="/api/stores", tags=["stores"])
app.include_router(projects_router, prefix="/api/projects", tags=["projects"])
app.include_router(materials_router, prefix="/api/materials", tags=["materials"])


@app.get("/")
def root():
    return {"status": "ok"}
