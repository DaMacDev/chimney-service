import { AwsClient } from "aws4fetch";
import { EMPTY_MANIFEST, parseManifest, type Manifest } from "./manifest";
import { landedUsage, type DayLedger, type LandedUsage } from "./limits";

/**
 * Server-side access to the R2 media bucket over its S3 API (admin only).
 * Op costs: GET/HEAD = Class B, PUT/LIST = Class A, DELETE = free.
 */

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var ${name}`);
  return value;
}

function client() {
  return new AwsClient({
    accessKeyId: env("R2_ACCESS_KEY_ID"),
    secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
    service: "s3",
    region: "auto",
  });
}

/**
 * Signed, never-cached request. aws4fetch's own `fetch` treats `cache` as its
 * credential cache, so Next's fetch cache would otherwise serve stale bucket
 * reads (stale manifest ETag => every save "conflicts").
 */
async function r2(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(await client().sign(url, init), { cache: "no-store" });
}

const bucketUrl = () =>
  `https://${env("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com/${env("R2_BUCKET")}`;

const HISTORY_PREFIX = "manifest-history/";
const HISTORY_KEEP = 20;

export interface StoredManifest {
  manifest: Manifest;
  /** ETag of the stored file, for a conditional save; null when none exists yet. */
  etag: string | null;
}

export class ConflictError extends Error {}

/** Uncached JSON read with its ETag; null json when the object doesn't exist. */
async function readJson(key: string): Promise<{ json: unknown; etag: string | null }> {
  const res = await r2(`${bucketUrl()}/${key}`);
  if (res.status === 404) return { json: null, etag: null };
  if (!res.ok) throw new Error(`Reading ${key} failed: ${res.status}`);
  // R2 gzips the JSON for fetch's Accept-Encoding and then marks the ETag weak
  // (W/"…"); If-Match compares strongly, so use the underlying strong value.
  return { json: await res.json(), etag: res.headers.get("etag")?.replace(/^W\//, "") ?? null };
}

/** Writes only if the object is unchanged since `etag` was read (null = must not exist yet). */
async function writeJson(key: string, value: unknown, etag: string | null): Promise<void> {
  const res = await r2(`${bucketUrl()}/${key}`, {
    method: "PUT",
    body: JSON.stringify(value, null, 2),
    headers: {
      "content-type": "application/json",
      "cache-control": "no-cache",
      ...(etag ? { "if-match": etag } : { "if-none-match": "*" }),
    },
  });
  if (res.status === 412) throw new ConflictError(`${key} changed since it was read`);
  if (!res.ok) throw new Error(`Saving ${key} failed: ${res.status}`);
}

/** Uncached read for editing (the public site reads the cached copy). */
export async function readManifest(): Promise<StoredManifest> {
  const { json, etag } = await readJson("manifest.json");
  if (json === null) return { manifest: EMPTY_MANIFEST, etag: null };
  const manifest = parseManifest(json);
  if (!manifest) throw new Error("Stored manifest is invalid");
  return { manifest, etag };
}

/**
 * Saves only if nobody else saved since `etag` was read, keeps a history copy
 * and prunes history to the newest HISTORY_KEEP.
 */
export async function writeManifest(manifest: Manifest, etag: string | null): Promise<void> {
  await writeJson("manifest.json", manifest, etag);
  // Best-effort: the save already succeeded, so a history hiccup must not report failure.
  try {
    const stamp = manifest.updatedAt.replace(/[:.]/g, "-");
    await writeJson(`${HISTORY_PREFIX}${stamp}.json`, manifest, null);
    const history = (await listObjects(HISTORY_PREFIX)).sort((a, b) => b.key.localeCompare(a.key));
    await Promise.all(history.slice(HISTORY_KEEP).map((o) => deleteObject(o.key)));
  } catch {}
}

/**
 * Per-UTC-day upload reservations: presigned links count against the caps
 * before they land, and deleting files doesn't hand slots back. One tiny file
 * per day under usage/ (~365 a year; negligible storage).
 */
const ledgerKey = (now: Date) => `usage/${now.toISOString().slice(0, 10)}.json`;

export async function readLedger(
  now = new Date(),
): Promise<{ ledger: DayLedger; etag: string | null }> {
  const { json, etag } = await readJson(ledgerKey(now));
  const j = (json ?? {}) as Partial<DayLedger>;
  const ledger =
    Number.isInteger(j.count) && Number.isInteger(j.bytes)
      ? { count: j.count as number, bytes: j.bytes as number }
      : { count: 0, bytes: 0 };
  return { ledger, etag };
}

/** Throws ConflictError if another reservation landed since the read. */
export async function writeLedger(
  ledger: DayLedger,
  etag: string | null,
  now = new Date(),
): Promise<void> {
  await writeJson(ledgerKey(now), ledger, etag);
}

export interface ListedObject {
  key: string;
  bytes: number;
  lastModified: Date;
}

export async function listObjects(prefix = ""): Promise<ListedObject[]> {
  const out: ListedObject[] = [];
  let token: string | null = null;
  do {
    const url = new URL(bucketUrl());
    url.searchParams.set("list-type", "2");
    if (prefix) url.searchParams.set("prefix", prefix);
    if (token) url.searchParams.set("continuation-token", token);
    const res = await r2(url.toString());
    if (!res.ok) throw new Error(`Listing bucket failed: ${res.status}`);
    const xml = await res.text();
    for (const [, block] of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      out.push({
        key: decodeXml(/<Key>([\s\S]*?)<\/Key>/.exec(block)?.[1] ?? ""),
        bytes: Number(/<Size>(\d+)<\/Size>/.exec(block)?.[1] ?? 0),
        lastModified: new Date(/<LastModified>([^<]+)<\/LastModified>/.exec(block)?.[1] ?? 0),
      });
    }
    token = /<IsTruncated>true<\/IsTruncated>/.test(xml)
      ? decodeXml(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/.exec(xml)?.[1] ?? "")
      : null;
  } while (token);
  return out;
}

const decodeXml = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

/** What the bucket holds now. One LIST (Class A): admin paths only, never public ones. */
export async function bucketUsage(now = new Date()): Promise<LandedUsage> {
  return landedUsage(await listObjects(), now);
}

/** Size of an object, or null if it doesn't exist. */
export async function headObject(key: string): Promise<number | null> {
  const res = await r2(`${bucketUrl()}/${key}`, { method: "HEAD" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HEAD ${key} failed: ${res.status}`);
  return Number(res.headers.get("content-length"));
}

export async function deleteObject(key: string): Promise<void> {
  const res = await r2(`${bucketUrl()}/${key}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404) throw new Error(`DELETE ${key} failed: ${res.status}`);
}

/** Headers the browser must send with a presigned PUT (all are signed). */
export function uploadHeaders(contentType: string, sha256Hex: string): Record<string, string> {
  return {
    "content-type": contentType,
    "cache-control": "public, max-age=31536000, immutable",
    "x-amz-checksum-sha256": Buffer.from(sha256Hex, "hex").toString("base64"),
  };
}

/**
 * A 2-minute upload link for exactly this key, type, size and content: the
 * signed SHA-256 makes R2 refuse any other bytes, so a leaked or replayed link
 * can only rewrite the identical file. Expiry is checked at request start, so
 * slow uploads still finish.
 */
export async function presignUpload(
  key: string,
  contentType: string,
  bytes: number,
  sha256Hex: string,
): Promise<string> {
  const url = new URL(`${bucketUrl()}/${key}`);
  url.searchParams.set("X-Amz-Expires", "120");
  const signed = await client().sign(url.toString(), {
    method: "PUT",
    headers: { ...uploadHeaders(contentType, sha256Hex), "content-length": String(bytes) },
    aws: { signQuery: true, allHeaders: true },
  });
  return signed.url;
}
