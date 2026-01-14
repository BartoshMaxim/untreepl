import { PrismaClient } from '@prisma/client';
import { JobState } from '~/models/job.state';

export enum JobStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  FAILED = "FAILED",
  COMPLETED = "COMPLETED",
}

export enum JobType {
  ORDERS = "ORDERS",
  PRODUCTS = "PRODUCTS",
  FULFILLMENT_SERVICE = "FULFILLMENT_SERVICE",  
}


export class Job {
  id: string;
  shop: string;
  status: JobStatus;
  type: JobType;
  settings?: string | null;
  lastHeartbeatAt?: Date | null;
  attempt: number;
  createdAt: Date;

  constructor(props: {
    id: string;
    shop: string;
    status: JobStatus;
    type?: JobType;
    settings?: string | null;
    lastHeartbeatAt?: Date | null;
    attempt?: number;
    createdAt: Date;
  }) {
    this.id = props.id;
    this.shop = props.shop;
    this.status = props.status;
    this.type = props.type ?? JobType.ORDERS;
    this.settings = props.settings ?? null;
    this.lastHeartbeatAt = props.lastHeartbeatAt ?? null;
    this.attempt = props.attempt ?? 0;
    this.createdAt = props.createdAt;
  }

  static fromPrisma(row: any) {
    return new Job({
      id: row.id,
      shop: row.shop,
      status: row.status as JobStatus,
      type: (row.type ?? JobType.ORDERS) as JobType,
      settings: row.settings,
      lastHeartbeatAt: row.lastHeartbeatAt ?? null,
      attempt: row.attempt ?? 0,
      createdAt: row.createdAt,
    });
  }

  static async create(prisma: PrismaClient, shop: string, type: JobType = JobType.ORDERS) {
    // casting to any because Prisma client types may need regeneration after schema change
    const row = await prisma.job.create({ data: ({ shop, status: JobStatus.PENDING, settings: null, type } as any) });
    return Job.fromPrisma(row);
  }

  toPrismaUpdate() {
    return {
      shop: this.shop,
      status: this.status,
      type: this.type,
      settings: this.settings,
      lastHeartbeatAt: this.lastHeartbeatAt,
      attempt: this.attempt,
    };
  }

  getState(): JobState {
    return JobState.fromJSON(this.settings);
  }

  setState(state: JobState) {
    this.settings = JSON.stringify(state);
  }

  async save(prisma: PrismaClient) {
    await prisma.job.update({ where: { id: this.id }, data: this.toPrismaUpdate() });
  }

  static async claim(prisma: PrismaClient, jobId: string): Promise<Job | null> {
    const updated = await prisma.$transaction(async (tx) => {
      const count = await tx.job.updateMany({
        where: { id: jobId, status: { in: [JobStatus.PENDING, JobStatus.FAILED] } },
        data: { status: JobStatus.RUNNING, attempt: { increment: 1 }, lastHeartbeatAt: new Date() }
      });
      if (count.count === 0) return null;
      return tx.job.findUnique({ where: { id: jobId } });
    });
    if (!updated) return null;
    return Job.fromPrisma(updated);
  }
} 
