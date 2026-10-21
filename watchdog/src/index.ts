/**
 * Hourly R2 free-tier watchdog (issue #12, ADR 0002). Reads month-to-date usage
 * for the whole account; at 50% of any free limit opens a GitHub issue, at 90%
 * also switches off the media bucket's public r2.dev URL so reads stop before
 * they can be billed. One issue per level per month.
 */
import { level, monthStart, report, sumOperations, type Level, type Usage } from "./usage";

export interface Env {
  ACCOUNT_ID: string;
  BUCKET: string;
  GITHUB_REPO: string;
  /** Cloudflare token: Account Analytics Read + Workers R2 Storage Edit. */
  CF_API_TOKEN: string;
  /** GitHub fine-grained token: Issues read/write on GITHUB_REPO only. */
  GITHUB_TOKEN: string;
}

const CF = "https://api.cloudflare.com/client/v4";

const QUERY = `query ($account: String!, $start: Time!, $end: Time!, $dayAgo: Time!) {
  viewer { accounts(filter: { accountTag: $account }) {
    ops: r2OperationsAdaptiveGroups(limit: 1000, filter: { datetime_geq: $start, datetime_leq: $end }) {
      sum { requests }
      dimensions { actionType }
    }
    storage: r2StorageAdaptiveGroups(limit: 1000, filter: { datetime_geq: $dayAgo, datetime_leq: $end }) {
      max { payloadSize metadataSize }
      dimensions { bucketName }
    }
  } }
}`;

interface GraphqlResult {
  data?: {
    viewer: {
      accounts: {
        ops: { sum: { requests: number }; dimensions: { actionType: string } }[];
        storage: { max: { payloadSize: number; metadataSize: number } }[];
      }[];
    };
  };
  errors?: { message: string }[];
}

export async function readUsage(env: Env, now: Date): Promise<Usage> {
  const res = await fetch(`${CF}/graphql`, {
    method: "POST",
    headers: { authorization: `Bearer ${env.CF_API_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({
      query: QUERY,
      variables: {
        account: env.ACCOUNT_ID,
        start: monthStart(now).toISOString(),
        end: now.toISOString(),
        dayAgo: new Date(now.getTime() - 86_400_000).toISOString(),
      },
    }),
  });
  const body = (await res.json()) as GraphqlResult;
  const account = body.data?.viewer.accounts[0];
  if (!res.ok || body.errors?.length || !account) {
    throw new Error(`analytics query failed: ${res.status} ${JSON.stringify(body.errors ?? [])}`);
  }
  const ops = sumOperations(
    account.ops.map((r) => ({ actionType: r.dimensions.actionType, requests: r.sum.requests })),
  );
  const storageBytes = account.storage.reduce(
    (total, r) => total + r.max.payloadSize + r.max.metadataSize,
    0,
  );
  return { storageBytes, ...ops };
}

async function disablePublicUrl(env: Env): Promise<void> {
  const res = await fetch(
    `${CF}/accounts/${env.ACCOUNT_ID}/r2/buckets/${env.BUCKET}/domains/managed`,
    {
      method: "PUT",
      headers: { authorization: `Bearer ${env.CF_API_TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify({ enabled: false }),
    },
  );
  if (!res.ok) throw new Error(`disabling r2.dev failed: ${res.status} ${await res.text()}`);
}

async function github(env: Env, path: string, init?: RequestInit): Promise<Response> {
  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      accept: "application/vnd.github+json",
      "user-agent": "r2-watchdog",
      ...init?.headers,
    },
  });
}

/** Opens the month's issue for this level unless one already exists. */
async function alertOnce(env: Env, lvl: Exclude<Level, "ok">, usage: Usage, now: Date) {
  const month = now.toISOString().slice(0, 7);
  const title =
    lvl === "kill"
      ? `R2 kill switch: public media switched off at 90% of free tier (${month})`
      : `R2 usage at 50% of free tier (${month})`;
  const q = encodeURIComponent(`repo:${env.GITHUB_REPO} is:issue in:title "${title}"`);
  const search = await github(env, `/search/issues?q=${q}`);
  if (!search.ok) throw new Error(`GitHub search failed: ${search.status}`);
  if (((await search.json()) as { total_count: number }).total_count > 0) return;

  const action =
    lvl === "kill"
      ? `The public media URL of \`${env.BUCKET}\` was switched off, so gallery photos and videos no longer load and no further reads can be billed. Usage resets on the 1st (UTC). To turn it back on:\n\n\`\`\`powershell\nnpx wrangler@4 r2 bucket dev-url enable ${env.BUCKET}\n\`\`\``
      : `Nothing was switched off. At 90% the watchdog disables the bucket's public URL.`;
  const res = await github(env, `/repos/${env.GITHUB_REPO}/issues`, {
    method: "POST",
    body: JSON.stringify({
      title,
      body: `${action}\n\nMonth-to-date, whole account:\n\n${report(usage)}`,
    }),
  });
  if (!res.ok) throw new Error(`GitHub issue failed: ${res.status} ${await res.text()}`);
}

export async function check(env: Env, now = new Date()): Promise<Level> {
  const usage = await readUsage(env, now);
  const lvl = level(usage);
  if (lvl === "kill") await disablePublicUrl(env);
  if (lvl !== "ok") await alertOnce(env, lvl, usage, now);
  console.log(JSON.stringify({ level: lvl, ...usage }));
  return lvl;
}

const worker = {
  async scheduled(_controller: unknown, env: Env): Promise<void> {
    await check(env);
  },
};

export default worker;
