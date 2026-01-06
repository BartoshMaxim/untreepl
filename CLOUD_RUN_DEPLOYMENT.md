# Cloud Run Jobs Deployment Guide

## Overview
This guide explains how to deploy the `sync-worker.ts` as a Cloud Run Job that can be triggered via `triggerCloudRunJob()`.

## Prerequisites
- Google Cloud Project with Cloud Run API enabled
- Docker installed locally
- `gcloud` CLI configured
- Proper IAM permissions to deploy to Cloud Run

## Deployment Steps

### 1. Build and Push Docker Image

```bash
# Set your GCP project and image details
export PROJECT_ID=your-gcp-project-id
export REGION=us-central1
export IMAGE_NAME=shopify-sync-job
export IMAGE_URL=${REGION}-docker.pkg.dev/${PROJECT_ID}/cloud-run-repo/${IMAGE_NAME}

# Create the Artifact Registry repository (if not exists)
gcloud artifacts repositories create cloud-run-repo \
  --repository-format=docker \
  --location=${REGION}

# Build the Docker image
docker build -f Dockerfile.job -t ${IMAGE_URL}:latest .

# Push to Artifact Registry
docker push ${IMAGE_URL}:latest
```

### 2. Create the Cloud Run Job

```bash
gcloud run jobs create ${JOB_NAME} \
  --image ${IMAGE_URL}:latest \
  --region ${REGION} \
  --set-env-vars="SHOPIFY_API_KEY=${SHOPIFY_API_KEY}" \
  --set-env-vars="SHOPIFY_API_SECRET=${SHOPIFY_API_SECRET}" \
  --set-env-vars="SCOPES=${SCOPES}" \
  --set-env-vars="HOST=${HOST}" \
  --set-env-vars="GCP_PROJECT_ID=${PROJECT_ID}" \
  --set-env-vars="GCP_REGION=${REGION}" \
  --set-env-vars="DATABASE_URL=${DATABASE_URL}" \
  --memory 1Gi \
  --cpu 1 \
  --timeout 3600 \
  --max-retries 1 \
  --service-account=${SERVICE_ACCOUNT_EMAIL}
```

### 3. Grant Cloud Run Jobs Execute Permission

```bash
# Get your app's service account
export APP_SERVICE_ACCOUNT=$(gcloud iam service-accounts list \
  --filter="displayName:shopify-sync-app" \
  --format="value(email)")

# Grant permission to execute the job
gcloud run jobs add-iam-policy-binding ${JOB_NAME} \
  --region ${REGION} \
  --member=serviceAccount:${APP_SERVICE_ACCOUNT} \
  --role=roles/run.invoker
```

### 4. Update Environment Variables

Store these in your `.env` or deployment configuration:

```
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1
CLOUD_RUN_JOB_NAME=shopify-sync-job
```

## Triggering the Job

From your Remix app, call:

```typescript
import { triggerCloudRunJob } from '~/services/job.controller';

// Trigger the job
const result = await triggerCloudRunJob(jobId);
```

## Updating the Job

When you make changes to `sync-worker.ts`:

```bash
# Rebuild and push
docker build -f Dockerfile.job -t ${IMAGE_URL}:latest .
docker push ${IMAGE_URL}:latest

# Update the Cloud Run Job
gcloud run jobs update ${JOB_NAME} \
  --region ${REGION} \
  --image ${IMAGE_URL}:latest
```

## Monitoring

View job execution logs:

```bash
gcloud run jobs logs read ${JOB_NAME} \
  --region ${REGION} \
  --limit 50
```

Watch a specific execution:

```bash
gcloud run jobs executions describe EXECUTION_NAME \
  --region ${REGION} \
  --job ${JOB_NAME}
```

## Troubleshooting

### Job fails with "JOB_ID required"
- Verify `triggerCloudRunJob()` is properly setting the JOB_ID environment variable
- Check Cloud Run job environment variable configuration

### Permission denied errors
- Ensure the service account has:
  - `roles/run.invoker` on the job
  - Access to Cloud SQL (if using database)
  - Access to any other resources the worker needs

### Database connection issues
- Verify `DATABASE_URL` environment variable is set correctly
- Ensure Cloud SQL Admin API is enabled
- Check Cloud SQL Proxy is configured if using private IP

## Cost Optimization

- Set `--timeout 3600` (1 hour) to prevent runaway executions
- Use `--max-retries 1` to avoid accidental duplicate processing
- Monitor execution time and adjust CPU/memory if needed
