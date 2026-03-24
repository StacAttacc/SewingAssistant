import os
from dotenv import load_dotenv

load_dotenv()
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from database import init_db
from api.patterns import router as patterns_router
from api.stores import router as stores_router
from api.projects import router as projects_router
from api.materials import router as materials_router
from api.llm import router as llm_router

UPLOADS_DIR = os.getenv("UPLOADS_DIR", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Sewing Assistant API", lifespan=lifespan)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

app.include_router(patterns_router, prefix="/api/patterns", tags=["patterns"])
app.include_router(stores_router, prefix="/api/stores", tags=["stores"])
app.include_router(projects_router, prefix="/api/projects", tags=["projects"])
app.include_router(materials_router, prefix="/api/materials", tags=["materials"])
app.include_router(llm_router, prefix="/api/llm", tags=["llm"])


@app.get("/")
def root():
    return {"status": "ok"}
