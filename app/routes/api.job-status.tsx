import type { LoaderFunctionArgs } from "react-router";
import prisma from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    console.log("api.job-status.tsx loader called");

    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');

    console.log("api.job-status.tsx loader jobId", jobId);

    if (!jobId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing jobId (query param 'jobId' required)"
        }),
        { 
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    // Get job from database
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Job not found"
        }),
        { 
          status: 404,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        status: job.status,
        type: job.type,
        shop: job.shop,
        createdAt: job.createdAt,
      }),
      { 
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  } catch (error) {
    console.error("Job status retrieval error:", error);
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