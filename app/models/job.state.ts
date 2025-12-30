
export type PageInfo = {
  cursor: string | null;
  hasNext: boolean;
  processed: number;
};

export class JobState {
  version: number;
  pageInfo: PageInfo;

  constructor(version = 1, pageInfo?: PageInfo) {
    this.version = version;
    this.pageInfo = pageInfo ?? { cursor: null, hasNext: true, processed: 0 };
  }

  static initial() {
    return new JobState();
  }

  static fromJSON(src: string | null | undefined) {
    if (!src) return JobState.initial();
    const parsed = typeof src === "string" ? JSON.parse(src) : src;
    return new JobState(parsed.version ?? 1, parsed.pageInfo ?? { cursor: null, hasNext: true, processed: 0 });
  }

  toJSON() {
    return {
      version: this.version,
      pageInfo: this.pageInfo,
    };
  }
} 
