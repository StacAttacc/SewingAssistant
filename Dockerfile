# Stage 1: build React frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
ARG VITE_API_URL=""
RUN npm run build

# Stage 2: Python backend
FROM python:3.12-slim
WORKDIR /app

RUN pip install uv

COPY backend/pyproject.toml ./
COPY backend/uv.lock* ./
RUN uv sync --no-dev --no-install-project 2>/dev/null || uv pip install -r pyproject.toml

COPY backend/ .

# Copy built frontend into backend/static so FastAPI can serve it
COPY --from=frontend-builder /frontend/dist ./static

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
