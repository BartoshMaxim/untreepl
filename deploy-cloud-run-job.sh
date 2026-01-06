#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${1:-}"
REGION="${2:-us-central1}"
JOB_NAME="${3:-shopify-sync-job}"
SERVICE_ACCOUNT_NAME="shopify-sync-app"

if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}Usage: ./deploy-cloud-run-job.sh <PROJECT_ID> [REGION] [JOB_NAME]${NC}"
  echo "Example: ./deploy-cloud-run-job.sh my-gcp-project us-central1 shopify-sync-job"
  exit 1
fi

echo -e "${YELLOW}Deploying Cloud Run Job for sync-worker...${NC}"

# Set Google Cloud project
gcloud config set project "$PROJECT_ID"
echo -e "${GREEN}✓ Set GCP project to $PROJECT_ID${NC}"

# Enable required APIs
echo -e "${YELLOW}Enabling required APIs...${NC}"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudresourcemanager.googleapis.com

# Create Artifact Registry repository
REPO_NAME="cloud-run-repo"
echo -e "${YELLOW}Creating/verifying Artifact Registry repository...${NC}"
gcloud artifacts repositories describe "$REPO_NAME" \
  --location="$REGION" \
  --project="$PROJECT_ID" 2>/dev/null || \
gcloud artifacts repositories create "$REPO_NAME" \
  --repository-format=docker \
  --location="$REGION" \
  --project="$PROJECT_ID"
echo -e "${GREEN}✓ Artifact Registry repository ready${NC}"

# Configure Docker authentication
echo -e "${YELLOW}Configuring Docker authentication...${NC}"
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

# Build and push image
IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/shopify-sync-job"
echo -e "${YELLOW}Building Docker image: $IMAGE_URL${NC}"
docker build -f Dockerfile.job -t "${IMAGE_URL}:latest" .
echo -e "${GREEN}✓ Docker image built${NC}"

echo -e "${YELLOW}Pushing image to Artifact Registry...${NC}"
docker push "${IMAGE_URL}:latest"
echo -e "${GREEN}✓ Image pushed${NC}"

# Create service account if it doesn't exist
echo -e "${YELLOW}Setting up service account...${NC}"
gcloud iam service-accounts describe "${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project="$PROJECT_ID" 2>/dev/null || \
gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
  --display-name="Service account for Shopify sync app" \
  --project="$PROJECT_ID"
echo -e "${GREEN}✓ Service account ready${NC}"

# Grant necessary roles
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
echo -e "${YELLOW}Granting IAM roles...${NC}"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/cloudsql.client" \
  --condition=None \
  --quiet 2>/dev/null || true

# Check if job exists and delete for update
if gcloud run jobs describe "$JOB_NAME" --region="$REGION" --project="$PROJECT_ID" 2>/dev/null; then
  echo -e "${YELLOW}Deleting existing job for update...${NC}"
  gcloud run jobs delete "$JOB_NAME" --region="$REGION" --project="$PROJECT_ID" --quiet
fi

# Create Cloud Run Job
echo -e "${YELLOW}Creating Cloud Run Job...${NC}"
gcloud run jobs create "$JOB_NAME" \
  --image="${IMAGE_URL}:latest" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --service-account="${SERVICE_ACCOUNT_EMAIL}" \
  --memory=1Gi \
  --cpu=1 \
  --timeout=3600 \
  --max-retries=1 \
  --task-timeout=3600 \
  --set-env-vars="SHOPIFY_API_KEY=${SHOPIFY_API_KEY:-}" \
  --set-env-vars="SHOPIFY_API_SECRET=${SHOPIFY_API_SECRET:-}" \
  --set-env-vars="SCOPES=${SCOPES:-}" \
  --set-env-vars="HOST=${HOST:-}" \
  --set-env-vars="GCP_PROJECT_ID=${PROJECT_ID}" \
  --set-env-vars="GCP_REGION=${REGION}" \
  --set-env-vars="DATABASE_URL=${DATABASE_URL:-}" \
  --set-env-vars="THREEPL_API_KEY=${THREEPL_API_KEY:-}" \
  --set-env-vars="THREEPL_API_URL=${THREEPL_API_URL:-}"

echo -e "${GREEN}✓ Cloud Run Job created${NC}"

# Grant invoker role to the main app service account
echo -e "${YELLOW}Configuring job invoker permissions...${NC}"
gcloud run jobs add-iam-policy-binding "$JOB_NAME" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/run.invoker" \
  --quiet 2>/dev/null || true

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Job Details:"
echo "  Name: $JOB_NAME"
echo "  Region: $REGION"
echo "  Project: $PROJECT_ID"
echo "  Image: ${IMAGE_URL}:latest"
echo ""
echo "Environment variables to set in your app:"
echo "  GCP_PROJECT_ID=$PROJECT_ID"
echo "  GCP_REGION=$REGION"
echo "  CLOUD_RUN_JOB_NAME=$JOB_NAME"
echo ""
echo "View logs:"
echo "  gcloud run jobs logs read $JOB_NAME --region=$REGION --project=$PROJECT_ID"
echo ""
echo "Test the job:"
echo "  gcloud run jobs execute $JOB_NAME --region=$REGION --project=$PROJECT_ID"
echo ""
