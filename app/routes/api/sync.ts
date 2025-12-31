import prisma from "~/db.server";
import { triggerCloudRunJob } from "~/services/job.controller";
import { Job, JobType } from "~/models/job";

export const loader = async ({ request }: any) => {
  const url = new URL(request.url);
  const jobTypeParam = url.searchParams.get('jobType') || undefined;
  
  const shop = url.searchParams.get('shop') || undefined;

  let jobType: JobType | undefined = undefined;

  if (jobTypeParam) {
    if (!Object.values(JobType).includes(jobTypeParam as JobType)) {
      return new Response("Invalid jobType query param", { status: 400 });
    }
    jobType = jobTypeParam as JobType;
  }
  if (!shop) {
    return new Response("Missing shop (query param 'shop' required)", { status: 401 });
  }

  // Ensure there's a session for this shop before creating a job
  const dbSession = await prisma.session.findFirst({ where: { shop } });
  if (!dbSession) {
    return new Response("No session found for shop", { status: 401 });
  }

  const job = await Job.create(prisma, shop, jobType);

  //await triggerCloudRunJob(job.id);

  return new Response(JSON.stringify({ jobId: job.id }), { status: 202 });
};
