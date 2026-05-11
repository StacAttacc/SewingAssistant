import os
from dotenv import load_dotenv

load_dotenv()
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from database import init_db
from api.patterns import router as patterns_router
from api.stores import router as stores_router
from api.projects import router as projects_router
from api.materials import router as materials_router
from api.llm import router as llm_router
from api.measurements import router as measurements_router

UPLOADS_DIR = os.getenv("UPLOADS_DIR", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Sewing Assistant API", lifespan=lifespan)

_cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173")
_cors_origins = [o.strip() for o in _cors_origins_raw.split(",") if o.strip()]
if _cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/health")
def health():
    return JSONResponse({"status": "ok"})

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

app.include_router(patterns_router, prefix="/api/patterns", tags=["patterns"])
app.include_router(stores_router, prefix="/api/stores", tags=["stores"])
app.include_router(projects_router, prefix="/api/projects", tags=["projects"])
app.include_router(materials_router, prefix="/api/materials", tags=["materials"])
app.include_router(llm_router, prefix="/api/llm", tags=["llm"])
app.include_router(measurements_router, prefix="/api/measurements", tags=["measurements"])


static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(static_dir):
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="vite-assets")

    @app.exception_handler(StarletteHTTPException)
    async def spa_handler(request: Request, exc: StarletteHTTPException):
        if exc.status_code == 404 and request.method == "GET" and not request.url.path.startswith("/api/"):
            path = request.url.path.lstrip("/")
            if path:
                candidate = os.path.normpath(os.path.join(static_dir, path))
                if candidate.startswith(static_dir + os.sep) and os.path.isfile(candidate):
                    return FileResponse(candidate)
            index = os.path.join(static_dir, "index.html")
            if os.path.isfile(index):
                return FileResponse(index)
        return JSONResponse({"detail": exc.detail}, status_code=exc.status_code)
