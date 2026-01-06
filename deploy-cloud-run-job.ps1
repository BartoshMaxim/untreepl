param(
    [string]$ProjectId,
    [string]$Region = "us-central1",
    [string]$JobName = "shopify-sync-job"
)

$ErrorActionPreference = "Stop"

# Colors
$Green = "`e[32m"
$Yellow = "`e[33m"
$Red = "`e[31m"
$Reset = "`e[0m"

if ([string]::IsNullOrEmpty($ProjectId)) {
    Write-Host "${Red}Usage: .\deploy-cloud-run-job.ps1 -ProjectId <PROJECT_ID> [-Region <REGION>] [-JobName <JOB_NAME>]${Reset}"
    Write-Host "Example: .\deploy-cloud-run-job.ps1 -ProjectId my-gcp-project"
    exit 1
}

$ServiceAccountName = "shopify-sync-app"

Write-Host "${Yellow}Deploying Cloud Run Job for sync-worker...${Reset}"

# Set Google Cloud project
gcloud config set project $ProjectId
Write-Host "${Green}✓ Set GCP project to $ProjectId${Reset}"

# Enable required APIs
Write-Host "${Yellow}Enabling required APIs...${Reset}"
gcloud services enable `
    run.googleapis.com `
    artifactregistry.googleapis.com `
    cloudresourcemanager.googleapis.com

# Create Artifact Registry repository
$RepoName = "cloud-run-repo"
Write-Host "${Yellow}Creating/verifying Artifact Registry repository...${Reset}"

$repoExists = gcloud artifacts repositories describe $RepoName `
    --location=$Region `
    --project=$ProjectId 2>&1

if ($LASTEXITCODE -ne 0) {
    gcloud artifacts repositories create $RepoName `
        --repository-format=docker `
        --location=$Region `
        --project=$ProjectId
}

Write-Host "${Green}✓ Artifact Registry repository ready${Reset}"

# Configure Docker authentication
Write-Host "${Yellow}Configuring Docker authentication...${Reset}"
gcloud auth configure-docker "$Region-docker.pkg.dev" --quiet

# Build and push image
$ImageUrl = "$Region-docker.pkg.dev/$ProjectId/$RepoName/shopify-sync-job"
Write-Host "${Yellow}Building Docker image: $ImageUrl${Reset}"
docker build -f Dockerfile.job -t "$($ImageUrl):latest" .
Write-Host "${Green}✓ Docker image built${Reset}"

Write-Host "${Yellow}Pushing image to Artifact Registry...${Reset}"
docker push "$($ImageUrl):latest"
Write-Host "${Green}✓ Image pushed${Reset}"

# Create service account if it doesn't exist
Write-Host "${Yellow}Setting up service account...${Reset}"
$ServiceAccountEmail = "$ServiceAccountName@$ProjectId.iam.gserviceaccount.com"

$saExists = gcloud iam service-accounts describe $ServiceAccountEmail `
    --project=$ProjectId 2>&1

if ($LASTEXITCODE -ne 0) {
    gcloud iam service-accounts create $ServiceAccountName `
        --display-name="Service account for Shopify sync app" `
        --project=$ProjectId
}

Write-Host "${Green}✓ Service account ready${Reset}"

# Grant necessary roles
Write-Host "${Yellow}Granting IAM roles...${Reset}"
gcloud projects add-iam-policy-binding $ProjectId `
    --member="serviceAccount:$ServiceAccountEmail" `
    --role="roles/cloudsql.client" `
    --quiet 2>$null

# Check if job exists and delete for update
Write-Host "${Yellow}Checking if job exists...${Reset}"
$jobExists = gcloud run jobs describe $JobName --region=$Region --project=$ProjectId 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "${Yellow}Deleting existing job for update...${Reset}"
    gcloud run jobs delete $JobName --region=$Region --project=$ProjectId --quiet
}

# Create Cloud Run Job
Write-Host "${Yellow}Creating Cloud Run Job...${Reset}"

$envVars = @(
    "SHOPIFY_API_KEY=$($env:SHOPIFY_API_KEY)"
    "SHOPIFY_API_SECRET=$($env:SHOPIFY_API_SECRET)"
    "SCOPES=$($env:SCOPES)"
    "HOST=$($env:HOST)"
    "GCP_PROJECT_ID=$ProjectId"
    "GCP_REGION=$Region"
    "DATABASE_URL=$($env:DATABASE_URL)"
    "THREEPL_API_KEY=$($env:THREEPL_API_KEY)"
    "THREEPL_API_URL=$($env:THREEPL_API_URL)"
)

$envVarArgs = $envVars | ForEach-Object { "--set-env-vars=$_" }

& gcloud run jobs create $JobName `
    --image="$($ImageUrl):latest" `
    --region=$Region `
    --project=$ProjectId `
    --service-account=$ServiceAccountEmail `
    --memory=1Gi `
    --cpu=1 `
    --timeout=3600 `
    --max-retries=1 `
    --task-timeout=3600 `
    $envVarArgs

Write-Host "${Green}✓ Cloud Run Job created${Reset}"

# Grant invoker role
Write-Host "${Yellow}Configuring job invoker permissions...${Reset}"
gcloud run jobs add-iam-policy-binding $JobName `
    --region=$Region `
    --project=$ProjectId `
    --member="serviceAccount:$ServiceAccountEmail" `
    --role="roles/run.invoker" `
    --quiet 2>$null

Write-Host ""
Write-Host "${Green}========================================${Reset}"
Write-Host "${Green}Deployment Complete!${Reset}"
Write-Host "${Green}========================================${Reset}"
Write-Host ""
Write-Host "Job Details:"
Write-Host "  Name: $JobName"
Write-Host "  Region: $Region"
Write-Host "  Project: $ProjectId"
Write-Host "  Image: $($ImageUrl):latest"
Write-Host ""
Write-Host "Environment variables to set in your app:"
Write-Host "  GCP_PROJECT_ID=$ProjectId"
Write-Host "  GCP_REGION=$Region"
Write-Host "  CLOUD_RUN_JOB_NAME=$JobName"
Write-Host ""
Write-Host "View logs:"
Write-Host "  gcloud run jobs logs read $JobName --region=$Region --project=$ProjectId"
Write-Host ""
Write-Host "Test the job:"
Write-Host "  gcloud run jobs execute $JobName --region=$Region --project=$ProjectId"
Write-Host ""
