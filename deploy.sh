#!/usr/bin/env bash
set -euo pipefail

# MomentLab GCP Cloud Run Deployment Script
# Uses local Docker build + Artifact Registry + Cloud Run deployment

PROJECT_ID="${GCP_PROJECT_ID:-momentlab-504305}"
REGION="${GCP_REGION:-us-central1}"
GCP_ACCOUNT="${GCP_ACCOUNT:-guarded.ops@gmail.com}"
SERVICE_NAME="momentlab-web"
REPO_NAME="momentlab-repo"
IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:latest"

export CLOUDSDK_CORE_PROJECT="${PROJECT_ID}"
export CLOUDSDK_CORE_ACCOUNT="${GCP_ACCOUNT}"

# ClickHouse & Runtime Settings (non-secret values)
CH_HOST="${CLICKHOUSE_HOST:-nk8zetjq1w.us-east1.gcp.clickhouse.cloud}"
CH_PORT="${CLICKHOUSE_PORT:-8443}"
CH_USER="${CLICKHOUSE_USER:-default}"
CH_DB="${CLICKHOUSE_DATABASE:-${CLICKHOUSE_DB:-momentlab}}"
CH_SECURE="${CLICKHOUSE_SECURE:-true}"
CH_WRITER_USER="${CLICKHOUSE_WRITER_USER:-momentlab_writer}"
CH_MCP_USER="${CLICKHOUSE_MCP_USER:-momentlab_mcp_reader}"

echo "=== MomentLab GCP Cloud Run Deployment ==="
echo "Project ID: ${PROJECT_ID}"
echo "Account:    ${GCP_ACCOUNT}"
echo "Region:     ${REGION}"
echo "Service:    ${SERVICE_NAME}"
echo "Image:      ${IMAGE_NAME}"
echo "ClickHouse: ${CH_HOST}:${CH_PORT}"
echo "=========================================="

# 1. Validate Required Secret Manager Secrets
echo "[1/6] Validating Secret Manager secrets in project ${PROJECT_ID}..."
REQUIRED_SECRETS=(
    "clickhouse-default-password"
    "clickhouse-writer-credentials"
    "clickhouse-mcp-credentials"
    "reviewer-tokens"
)

for secret in "${REQUIRED_SECRETS[@]}"; do
    if ! gcloud secrets describe "${secret}" --project="${PROJECT_ID}" --account="${GCP_ACCOUNT}" >/dev/null 2>&1; then
        echo "ERROR: Required secret '${secret}' is missing in Secret Manager (project ${PROJECT_ID})." >&2
        exit 1
    fi
    echo "Secret confirmed present: ${secret}"
done

# 2. Enable Required GCP APIs
echo "[2/6] Enabling Google Cloud APIs..."
gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    aiplatform.googleapis.com \
    secretmanager.googleapis.com \
    --project="${PROJECT_ID}" \
    --account="${GCP_ACCOUNT}"

# 3. Create Artifact Registry Docker repository if not exists
echo "[3/6] Ensuring Artifact Registry repository exists..."
gcloud artifacts repositories describe "${REPO_NAME}" --location="${REGION}" --project="${PROJECT_ID}" --account="${GCP_ACCOUNT}" >/dev/null 2>&1 || \
gcloud artifacts repositories create "${REPO_NAME}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="MomentLab Docker repository" \
    --project="${PROJECT_ID}" \
    --account="${GCP_ACCOUNT}"

# 4. Configure Docker GCP Authentication
echo "[4/6] Authenticating Docker with Artifact Registry..."
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --account="${GCP_ACCOUNT}" --quiet

# 5. Build and Push Container Image using local Docker
echo "[5/6] Building and pushing Docker container image locally..."
docker build --platform linux/amd64 -t "${IMAGE_NAME}" .
docker push "${IMAGE_NAME}"

# 6. Deploy to Cloud Run
echo "[6/6] Deploying image to Cloud Run with Secret Manager references..."
gcloud run deploy "${SERVICE_NAME}" \
    --image="${IMAGE_NAME}" \
    --platform=managed \
    --region="${REGION}" \
    --account="${GCP_ACCOUNT}" \
    --allow-unauthenticated \
    --port=8080 \
    --memory=2Gi \
    --cpu=2 \
    --set-env-vars="GCP_PROJECT_ID=${PROJECT_ID},GCP_LOCATION=${REGION},GOOGLE_CLOUD_PROJECT=${PROJECT_ID},GOOGLE_CLOUD_LOCATION=${REGION},GOOGLE_GENAI_USE_VERTEXAI=true,CLICKHOUSE_HOST=${CH_HOST},CLICKHOUSE_PORT=${CH_PORT},CLICKHOUSE_USER=${CH_USER},CLICKHOUSE_DB=${CH_DB},CLICKHOUSE_DATABASE=${CH_DB},CLICKHOUSE_SECURE=${CH_SECURE},CLICKHOUSE_WRITER_USER=${CH_WRITER_USER},CLICKHOUSE_MCP_USER=${CH_MCP_USER}" \
    --set-secrets="CLICKHOUSE_PASSWORD=clickhouse-default-password:latest,CLICKHOUSE_WRITER_PASSWORD=clickhouse-writer-credentials:latest,CLICKHOUSE_MCP_PASSWORD=clickhouse-mcp-credentials:latest,REVIEWER_TOKENS=reviewer-tokens:latest" \
    --project="${PROJECT_ID}"

# Fetch Hosted Service URL
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --platform=managed --region="${REGION}" --project="${PROJECT_ID}" --account="${GCP_ACCOUNT}" --format='value(status.url)')

echo "=========================================="
echo "Deployment Complete!"
echo "Public Cloud Run URL: ${SERVICE_URL}"
echo "=========================================="
