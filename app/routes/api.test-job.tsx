import type { LoaderFunctionArgs } from "react-router";
import { json } from "react-router";
import prisma from "~/db.server";
import { triggerCloudRunJob } from "~/services/job.controller";
import { Job, JobType } from "~/models/job";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    console.log("api.test-job.tsx loader called");

    const url = new URL(request.url);
    const jobTypeParam = url.searchParams.get('jobType');
    const apiUrl = url.searchParams.get('apiUrl') || undefined;

    console.log("api.test-job.tsx loader request.url", request.url);
    console.log("api.test-job.tsx loader apiUrl", apiUrl);

    // Default job type is ORDERS
    let jobType: JobType = JobType.ORDERS;

    if (jobTypeParam) {
      if (!Object.values(JobType).includes(jobTypeParam as JobType)) {
        return new Response("Invalid jobType query param", { status: 400 });
      }
      jobType = jobTypeParam as JobType;
    }

    // Get a random shop from sessions table
    const sessions = await prisma.session.findMany();
    if (!sessions || sessions.length === 0) {
      return new Response("No sessions found in database", { status: 404 });
    }

    const randomSession = sessions[Math.floor(Math.random() * sessions.length)];
    const shop = randomSession.shop;

    console.log("api.test-job.tsx loader shop", shop);

    // Create job
    const job = await Job.create(prisma, shop, jobType);

    console.log(`Created test job ${job.id} for shop ${shop} with type ${jobType}`);

    // Trigger CloudRun job with optional apiUrl
    await triggerCloudRunJob(job.id, apiUrl);

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        status: job.status,
        jobType: job.type,
        shop,
        apiUrl: apiUrl || "default",
        timestamp: new Date().toISOString()
      }),
      { 
        status: 202,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  } catch (error) {
    console.error("Test job creation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}