#!/usr/bin/env bash
set -euo pipefail

# MomentLab GCP Cloud Run Deployment Script
# Uses local Docker build + Artifact Registry + Cloud Run deployment

PROJECT_ID="${GCP_PROJECT_ID:-momentlab-504305}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="momentlab-web"
REPO_NAME="momentlab-repo"
IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:latest"

# ClickHouse Credentials (loaded from environment or defaults)
CH_HOST="${CLICKHOUSE_HOST:-nk8zetjq1w.us-east1.gcp.clickhouse.cloud}"
CH_PORT="${CLICKHOUSE_PORT:-8443}"
CH_USER="${CLICKHOUSE_USER:-default}"
CH_PASS="${CLICKHOUSE_PASSWORD:-O.oQbH5wEphMF}"
CH_DB="${CLICKHOUSE_DATABASE:-${CLICKHOUSE_DB:-momentlab}}"
CH_SECURE="${CLICKHOUSE_SECURE:-true}"
CH_WRITER_USER="${CLICKHOUSE_WRITER_USER:-momentlab_writer}"
CH_WRITER_PASS="${CLICKHOUSE_WRITER_PASSWORD:-O0qV*+qzkvl7fIsC#uXP7ThxXW3}"
CH_MCP_USER="${CLICKHOUSE_MCP_USER:-momentlab_mcp_reader}"
CH_MCP_PASS="${CLICKHOUSE_MCP_PASSWORD:-CSKREC!xde9@yuEy54yJxr#0OBH}"

echo "=== MomentLab GCP Cloud Run Deployment ==="
echo "Project ID: ${PROJECT_ID}"
echo "Region:     ${REGION}"
echo "Service:    ${SERVICE_NAME}"
echo "Image:      ${IMAGE_NAME}"
echo "ClickHouse: ${CH_HOST}:${CH_PORT}"
echo "=========================================="

# 1. Enable Required GCP APIs
echo "[1/5] Enabling Google Cloud APIs..."
gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    aiplatform.googleapis.com \
    secretmanager.googleapis.com \
    --project="${PROJECT_ID}"

# 2. Create Artifact Registry Docker repository if not exists
echo "[2/5] Ensuring Artifact Registry repository exists..."
gcloud artifacts repositories describe "${REPO_NAME}" --location="${REGION}" --project="${PROJECT_ID}" >/dev/null 2>&1 || \
gcloud artifacts repositories create "${REPO_NAME}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="MomentLab Docker repository" \
    --project="${PROJECT_ID}"

# 3. Configure Docker GCP Authentication
echo "[3/5] Authenticating Docker with Artifact Registry..."
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

# 4. Build and Push Container Image using local Docker
echo "[4/5] Building and pushing Docker container image locally..."
docker build --platform linux/amd64 -t "${IMAGE_NAME}" .
docker push "${IMAGE_NAME}"

# 5. Deploy to Cloud Run
echo "[5/5] Deploying image to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
    --image="${IMAGE_NAME}" \
    --platform=managed \
    --region="${REGION}" \
    --allow-unauthenticated \
    --port=8080 \
    --memory=2Gi \
    --cpu=2 \
    --set-env-vars="GCP_PROJECT_ID=${PROJECT_ID},GCP_LOCATION=${REGION},GOOGLE_CLOUD_PROJECT=${PROJECT_ID},GOOGLE_CLOUD_LOCATION=${REGION},GOOGLE_GENAI_USE_VERTEXAI=true,CLICKHOUSE_HOST=${CH_HOST},CLICKHOUSE_PORT=${CH_PORT},CLICKHOUSE_USER=${CH_USER},CLICKHOUSE_PASSWORD=${CH_PASS},CLICKHOUSE_DB=${CH_DB},CLICKHOUSE_DATABASE=${CH_DB},CLICKHOUSE_SECURE=${CH_SECURE},CLICKHOUSE_WRITER_USER=${CH_WRITER_USER},CLICKHOUSE_WRITER_PASSWORD=${CH_WRITER_PASS},CLICKHOUSE_MCP_USER=${CH_MCP_USER},CLICKHOUSE_MCP_PASSWORD=${CH_MCP_PASS}" \
    --project="${PROJECT_ID}"

# Fetch Hosted Service URL
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --platform=managed --region="${REGION}" --project="${PROJECT_ID}" --format='value(status.url)')

echo "=========================================="
echo "Deployment Complete!"
echo "Public Cloud Run URL: ${SERVICE_URL}"
echo "=========================================="
