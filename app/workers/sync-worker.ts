import prisma from "~/db.server";
import { transformOrderTo3PL, transformProductVariantTo3PL } from "~/services/transformers";
import { sendTo3PLBatch } from "~/services/threepl.sender";
import {shopifyApi, Session} from '@shopify/shopify-api';
import { fetchOrdersBatch, fetchProductsBatch } from '~/services/shopify.fetch';
import { makeSessionFromDb } from '~/services/shopify.session';
import { JobState } from '~/models/job.state';
import { Job, JobStatus, JobType } from '~/models/job';
import { apiVersion } from '~/shopify.server';

export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SCOPES!.split(','),
  hostName: process.env.HOST!.replace(/https?:\/\//, ''),
  apiVersion: apiVersion, // or latest version you target
  isEmbeddedApp: false,
});

const JOB_ID = process.env.JOB_ID;
if (!JOB_ID) {
  console.error("JOB_ID required");
  process.exit(2);
}

let activeJob: Job | null = null;

function makeIdempotencyKey(shop: string, jobId: string, type: string, cursorOrBatch: string | null) {
  return `${shop}|${jobId}|${type}|${cursorOrBatch ?? "start"}`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function processOrders(
  client: any,
  session: Session,
  job: Job,
  state: JobState,
  createdAtMin: string,
) {
  while (state.pageInfo.hasNext) {
    const batch = await fetchOrdersBatch(client, state.pageInfo.cursor, createdAtMin);
    if (!batch.nodes || batch.nodes.length === 0) {
      state.pageInfo.hasNext = false;
      break;
    }

    const payload = batch.nodes.map(transformOrderTo3PL);
    const idemp = makeIdempotencyKey(session.shop, job.id, "orders", state.pageInfo.cursor);
    await sendTo3PLBatch("orders", payload, idemp);

    // Persist state after successful send
    state.pageInfo.cursor = batch.nextCursor;
    state.pageInfo.hasNext = batch.hasNext;
    state.pageInfo.processed += payload.length;

    job.setState(state);
    job.lastHeartbeatAt = new Date();
    await job.save(prisma);

    await sleep(150);
  }
}

async function processProducts(
  client: any,
  session: Session,
  job: Job,
  state: JobState,
) {
  while (job.type === JobType.PRODUCTS && state.pageInfo.hasNext) {
    const batch = await fetchProductsBatch(client, state.pageInfo.cursor);
    if (!batch.nodes || batch.nodes.length === 0) {
      state.pageInfo.hasNext = false;
      break;
    }

    const payload: any[] = [];
    for (const p of batch.nodes) {
      const variants = p.variants?.edges ?? [];
      for (const ve of variants) {
        payload.push(transformProductVariantTo3PL(p, ve.node));
      }
    }

    const idemp = makeIdempotencyKey(session.shop, job.id, "products", state.pageInfo.cursor);
    await sendTo3PLBatch("products", payload, idemp);

    state.pageInfo.cursor = batch.nextCursor;
    state.pageInfo.hasNext = batch.hasNext;
    state.pageInfo.processed += payload.length;

    job.setState(state);
    job.lastHeartbeatAt = new Date();
    await job.save(prisma);

    await sleep(150);
  }
}

async function main() {
  const job = await Job.claim(prisma, JOB_ID!);
  if (!job) {
    console.log("Job not claimable. Exiting.");
    process.exit(0);
  }
  activeJob = job;

  const dbSession = await prisma.session.findFirst({ where: { shop: job.shop } });
  if (!dbSession) { 
    throw new Error("Session not found for shop " + job.shop);
  }

  const session = makeSessionFromDb(dbSession);

  const client = new shopify.clients.Graphql({session});

  let state: JobState = JobState.fromJSON(job.settings);

  // Compute createdAtMin (for 1 year of orders)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const createdAtMin = oneYearAgo.toISOString();

  // Process ORDERS then PRODUCTS if necessary
  if (job.type === JobType.ORDERS && state.pageInfo.hasNext) {
    await processOrders(client, session, job, state, createdAtMin);
  }

  if (job.type === JobType.PRODUCTS && state.pageInfo.hasNext) {
    await processProducts(client, session, job, state);
  }

  job.status = JobStatus.COMPLETED;
  job.setState(state);
  job.lastHeartbeatAt = new Date();
  await job.save(prisma);
  console.log("Job completed", job.id);
}

try {
  await main();
} catch (err) {
  console.error("Worker failed:", err);
  try {
    const row = await prisma.job.findUnique({ where: { id: JOB_ID } });
    if (row) {
      const failedJob = Job.fromPrisma(row);
      failedJob.status = JobStatus.FAILED;
      failedJob.lastHeartbeatAt = new Date();
      await failedJob.save(prisma);
    }
  } catch (e) {
    console.error("Failed to mark job failed:", e);
  }
  process.exit(1);
}
