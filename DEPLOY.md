# Deployment Plan

## Overview

Single Docker image: multi-stage build compiles the React frontend, then the FastAPI backend serves both the API and the static files. Image is pushed to GHCR via GitHub Actions and deployed to k3s via Flux.

---

## 1. Code changes (in this repo)

### 1a. Frontend — use relative API URL

Every fetch that currently points at `http://localhost:8000/api/` needs to use a relative path instead so it works on any hostname.

Replace the hardcoded base URL with a Vite env variable. In each file that uses `http://localhost:8000/api/`:

```js
// Before
const res = await fetch('http://localhost:8000/api/projects')

// After
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const res = await fetch(`${API}/api/projects`)
```

Then create `frontend/.env.production`:
```
VITE_API_URL=
```
(empty string = relative URLs, which is what we want in production)

And keep `frontend/.env.development` (optional, or just rely on the fallback):
```
VITE_API_URL=http://localhost:8000
```

### 1b. Backend — serve built frontend static files

In `backend/main.py`, add static file serving. At the bottom of the file, after all route definitions:

```python
from fastapi.staticfiles import StaticFiles
import os

# Serve React frontend (only if the build exists)
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
```

This means the API routes (`/api/...`) are registered first and take priority. The catch-all `/` mount serves the React app for everything else, including client-side routes.

---

## 2. Dockerfile (add to repo root)

```dockerfile
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
# Copy uv.lock if it exists
COPY backend/uv.lock* ./
RUN uv sync --no-dev --no-install-project 2>/dev/null || uv pip install -r pyproject.toml

COPY backend/ .

# Copy built frontend into backend/static so FastAPI can serve it
COPY --from=frontend-builder /frontend/dist ./static

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 3. GitHub Actions workflow (add to `.github/workflows/docker.yml`)

```yaml
name: Build and push image

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:latest
            ghcr.io/${{ github.repository }}:${{ github.sha }}
```

After merging this, the image will be at:
`ghcr.io/stacattacc/sewingassistant:latest`

Make the package public in GitHub → Packages → SewingAssistant → Package settings → Change visibility → Public (so k3s can pull it without credentials).

---

## 4. Anthropic API key

Store it in Vault, then come back — the BiggerWorld side will pull it via ExternalSecret.

```bash
# Run this once Vault is unsealed
kubectl exec -n vault vault-0 -- vault kv put secret/sewing-assistant anthropic-api-key=<your-key>
```

---

## What happens in BiggerWorld (handled separately)

Once the image is published and the API key is in Vault:

- `k8s/apps/sewing-assistant/` — namespace, deployment, service, ingress, storage (SQLite PVC), ExternalSecret for the API key
- `k8s/apps-config/authentik/blueprint-monitoring.yaml` — proxy provider + application entry
- `k8s/apps-config/authentik/blueprint-outpost.yaml` — add to outpost providers list

The app will be available at `sewing.tail789d60.ts.net` behind Authentik.
