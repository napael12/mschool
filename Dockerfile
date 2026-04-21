# ── Stage 1: Build React frontend ─────────────────────────────────────────
FROM node:20-alpine AS frontend
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Flask backend + serve built frontend ─────────────────────────
FROM python:3.12-slim
WORKDIR /app

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
COPY --from=frontend /frontend/dist ./dist

EXPOSE 8080
CMD gunicorn run:app --bind "0.0.0.0:${PORT:-8080}" --workers 2
