/**
 * R2 free-tier maths (https://developers.cloudflare.com/r2/pricing/). The free
 * tier is per account, so usage is summed over every bucket, not just ours.
 */

export const FREE_TIER = {
  storageBytes: 10 * 1024 ** 3,
  classA: 1_000_000,
  classB: 10_000_000,
} as const;

export type Metric = keyof typeof FREE_TIER;

const CLASS_B = new Set([
  "GetObject",
  "HeadObject",
  "HeadBucket",
  "UsageSummary",
  "GetBucketEncryption",
  "GetBucketLocation",
  "GetBucketCors",
  "GetBucketLifecycleConfiguration",
]);

const FREE_OPS = new Set(["DeleteObject", "DeleteBucket", "AbortMultipartUpload", "DeleteObjects"]);

/** Unknown action types count as Class A, the stricter limit. */
export function classify(actionType: string): "classA" | "classB" | "free" {
  if (FREE_OPS.has(actionType)) return "free";
  return CLASS_B.has(actionType) ? "classB" : "classA";
}

export interface Usage {
  storageBytes: number;
  classA: number;
  classB: number;
}

export function sumOperations(rows: { actionType: string; requests: number }[]) {
  const totals = { classA: 0, classB: 0 };
  for (const { actionType, requests } of rows) {
    const cls = classify(actionType);
    if (cls !== "free") totals[cls] += requests;
  }
  return totals;
}

/** Fraction of the free allowance used per metric (0.5 = 50%). */
export function shares(usage: Usage): Record<Metric, number> {
  return {
    storageBytes: usage.storageBytes / FREE_TIER.storageBytes,
    classA: usage.classA / FREE_TIER.classA,
    classB: usage.classB / FREE_TIER.classB,
  };
}

export const WARN_AT = 0.5;
export const KILL_AT = 0.9;

export type Level = "ok" | "warn" | "kill";

export function level(usage: Usage): Level {
  const worst = Math.max(...Object.values(shares(usage)));
  if (worst >= KILL_AT) return "kill";
  if (worst >= WARN_AT) return "warn";
  return "ok";
}

/** UTC start of the billing month containing `now`. */
export function monthStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function report(usage: Usage): string {
  const s = shares(usage);
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  return [
    `| Metric | Used | Free tier | Share |`,
    `|---|---|---|---|`,
    `| Storage | ${(usage.storageBytes / 1024 ** 3).toFixed(2)} GB | 10 GB | ${pct(s.storageBytes)} |`,
    `| Class A ops | ${usage.classA.toLocaleString("en")} | 1,000,000 | ${pct(s.classA)} |`,
    `| Class B ops | ${usage.classB.toLocaleString("en")} | 10,000,000 | ${pct(s.classB)} |`,
  ].join("\n");
}
