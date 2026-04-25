# ── Stage 1: Build the React frontend ────────────────────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

# Install dependencies first (layer-cached unless package files change)
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy source and build
COPY frontend/ ./
RUN npm run build


# ── Stage 2: Python runtime ───────────────────────────────────────────────────
FROM python:3.11-slim

# Install system packages needed by psycopg (libpq) and general build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev \
        gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies before copying the rest of the source so this
# layer is cached as long as requirements.txt doesn't change
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the full project source
COPY . .

# Copy the compiled frontend into the location Flask expects:
# DIST_FOLDER = <repo_root>/static  (see backend/app/__init__.py)
COPY --from=frontend-builder /app/frontend/dist ./static

EXPOSE 8080

CMD ["python", "backend/run.py"]
