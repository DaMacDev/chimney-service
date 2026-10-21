import { AwsClient } from "aws4fetch";
import { EMPTY_MANIFEST, parseManifest, type Manifest } from "./manifest";
import type { BucketUsage } from "./limits";

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

/** Uncached read for editing (the public site reads the cached copy). */
export async function readManifest(): Promise<StoredManifest> {
  const res = await r2(`${bucketUrl()}/manifest.json`);
  if (res.status === 404) return { manifest: EMPTY_MANIFEST, etag: null };
  if (!res.ok) throw new Error(`Reading manifest failed: ${res.status}`);
  const manifest = parseManifest(await res.json());
  if (!manifest) throw new Error("Stored manifest is invalid");
  // R2 gzips the JSON for fetch's Accept-Encoding and then marks the ETag weak
  // (W/"…"); If-Match compares strongly, so use the underlying strong value.
  return { manifest, etag: res.headers.get("etag")?.replace(/^W\//, "") ?? null };
}

export class ConflictError extends Error {}

/**
 * Saves only if nobody else saved since `etag` was read, keeps a history copy
 * and prunes history to the newest HISTORY_KEEP.
 */
export async function writeManifest(manifest: Manifest, etag: string | null): Promise<void> {
  const body = JSON.stringify(manifest, null, 2);
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "cache-control": "no-cache",
    ...(etag ? { "if-match": etag } : { "if-none-match": "*" }),
  };
  const res = await r2(`${bucketUrl()}/manifest.json`, { method: "PUT", body, headers });
  if (res.status === 412) throw new ConflictError("Manifest changed since it was read");
  if (!res.ok) throw new Error(`Saving manifest failed: ${res.status}`);

  const stamp = manifest.updatedAt.replace(/[:.]/g, "-");
  await r2(`${bucketUrl()}/${HISTORY_PREFIX}${stamp}.json`, {
    method: "PUT",
    body,
    headers: { "content-type": "application/json", "cache-control": "no-cache" },
  });
  const history = (await listObjects(HISTORY_PREFIX)).sort((a, b) => b.key.localeCompare(a.key));
  await Promise.all(history.slice(HISTORY_KEEP).map((o) => deleteObject(o.key)));
}

interface ListedObject {
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

/** Whole-bucket size (what R2 bills) and media files added today (UTC). */
export async function bucketUsage(now = new Date()): Promise<BucketUsage> {
  const objects = await listObjects();
  const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return {
    totalBytes: objects.reduce((sum, o) => sum + o.bytes, 0),
    uploadsToday: objects.filter(
      (o) => o.key.startsWith("media/") && o.lastModified.getTime() >= dayStart,
    ).length,
  };
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

/**
 * A 10-minute upload link for exactly this key, type and size: content-type and
 * content-length are signed, so R2 refuses any other file.
 */
export async function presignUpload(
  key: string,
  contentType: string,
  bytes: number,
): Promise<string> {
  const url = new URL(`${bucketUrl()}/${key}`);
  url.searchParams.set("X-Amz-Expires", "600");
  const signed = await client().sign(url.toString(), {
    method: "PUT",
    headers: {
      "content-type": contentType,
      "content-length": String(bytes),
      "cache-control": "public, max-age=31536000, immutable",
    },
    aws: { signQuery: true, allHeaders: true },
  });
  return signed.url;
}
