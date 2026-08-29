# Stage 1: Build Frontend React SPA
FROM node:20-alpine AS build-frontend
WORKDIR /app
COPY package*.json tsconfig*.json vite.config.ts index.html ./
COPY src ./src
COPY public ./public
RUN npm ci && npm run build

# Stage 2: Build Production Container with Python FastAPI
FROM python:3.14-slim
WORKDIR /app

# Install system dependencies and copy official uv/uvx binaries
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy backend requirements and install
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code, clickhouse DDL, and built frontend dist
COPY backend ./backend
COPY clickhouse ./clickhouse
COPY --from=build-frontend /app/dist ./static

EXPOSE 8080

ENV PORT=8080
ENV PYTHONPATH=/app

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
