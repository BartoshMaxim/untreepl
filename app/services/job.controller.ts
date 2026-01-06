import { GoogleAuth } from "google-auth-library";

const PROJECT_ID = process.env.GCP_PROJECT_ID!;
const REGION = process.env.GCP_REGION || "us-central1";
const JOB_NAME = process.env.CLOUD_RUN_JOB_NAME || "shopify-sync-job";

export interface CloudRunJobResponse {
  name: string;
  uid: string;
  createTime: string;
  startTime?: string;
}

export async function triggerCloudRunJob(jobId: string): Promise<CloudRunJobResponse> {
  if (!PROJECT_ID) {
    throw new Error("GCP_PROJECT_ID environment variable is not set");
  }

  if (!JOB_NAME) {
    throw new Error("CLOUD_RUN_JOB_NAME environment variable is not set");
  }

  try {
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"]
    });
    const client = await auth.getClient();
    const url = `https://run.googleapis.com/v2/projects/${PROJECT_ID}/locations/${REGION}/jobs/${JOB_NAME}:run`;

    const body = {
      overrides: {
        containerOverrides: [
          {
            env: [{ name: "JOB_ID", value: jobId }]
          }
        ]
      }
    };

    const resp = await client.request({
      url,
      method: "POST",
      data: body
    });

    return resp.data as CloudRunJobResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to trigger Cloud Run Job: ${error.message}`);
    }
    throw error;
  }
}
