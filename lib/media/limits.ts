/**
 * Upload guardrails that keep the media bucket inside R2's free tier (ADR 0002).
 * Shared by the admin UI (early feedback) and the server (the real check).
 */
import { adminCopy } from "@/lib/admin/copy";

const E = adminCopy.errors;

export const MB = 1024 * 1024;
export const GB = 1024 * MB;

/** Total bucket size the admin can never exceed (free tier is 10 GB). */
export const STORAGE_BUDGET_BYTES = 5 * GB;
export const MAX_IMAGE_BYTES = 10 * MB;
export const MAX_VIDEO_BYTES = 50 * MB;
/** New files per UTC day; stops a runaway loop from burning Class A writes. */
export const MAX_UPLOADS_PER_DAY = 100;
/** Photos are downscaled in the browser to this longest side before upload. */
export const IMAGE_MAX_SIDE = 2000;

export const TEXT_LIMITS = { name: 120, caption: 300, description: 1000 } as const;

export const UPLOAD_TYPES = {
  "image/jpeg": { ext: "jpg", kind: "image" },
  "video/mp4": { ext: "mp4", kind: "video" },
  "video/webm": { ext: "webm", kind: "video" },
  "video/quicktime": { ext: "mov", kind: "video" },
} as const;

export type UploadType = keyof typeof UPLOAD_TYPES;

export interface UploadRequest {
  sha256: string;
  contentType: string;
  bytes: number;
}

export interface BucketUsage {
  totalBytes: number;
  uploadsToday: number;
}

/** Bucket contents as listed, plus today's (UTC) share of new media. */
export interface LandedUsage extends BucketUsage {
  bytesToday: number;
}

/** Today's upload reservations (stored in R2, see store.ts). */
export interface DayLedger {
  count: number;
  bytes: number;
}

export function landedUsage(
  objects: { key: string; bytes: number; lastModified: Date }[],
  now: Date,
): LandedUsage {
  const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const today = objects.filter(
    (o) => o.key.startsWith("media/") && o.lastModified.getTime() >= dayStart,
  );
  return {
    totalBytes: objects.reduce((sum, o) => sum + o.bytes, 0),
    uploadsToday: today.length,
    bytesToday: today.reduce((sum, o) => sum + o.bytes, 0),
  };
}

/** Landed usage plus reservations that haven't landed yet (or were deleted since). */
export function withReservations(landed: LandedUsage, ledger: DayLedger): BucketUsage {
  return {
    totalBytes: landed.totalBytes + Math.max(0, ledger.bytes - landed.bytesToday),
    uploadsToday: Math.max(landed.uploadsToday, ledger.count),
  };
}

/** Strict object-key shapes accepted from the browser. */
export const MEDIA_KEY = /^media\/[a-f0-9]{24}\.(jpg|mp4|webm|mov)$/;
export const POSTER_KEY = /^media\/[a-f0-9]{24}\.jpg$/;

/** Returns a Spanish error for the owner, or null when the upload may proceed. */
export function checkUpload(req: UploadRequest, usage: BucketUsage): string | null {
  const type = UPLOAD_TYPES[req.contentType as UploadType];
  if (!type) return E.typeNotAllowed;
  if (!/^[a-f0-9]{64}$/.test(req.sha256)) return E.invalidFile;
  if (!Number.isInteger(req.bytes) || req.bytes <= 0) return E.emptyFile;
  const max = type.kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (req.bytes > max) {
    return type.kind === "image" ? E.photoTooBig : E.videoTooBig;
  }
  if (usage.uploadsToday >= MAX_UPLOADS_PER_DAY) {
    return E.dailyLimit(MAX_UPLOADS_PER_DAY);
  }
  if (usage.totalBytes + req.bytes > STORAGE_BUDGET_BYTES) {
    return E.storageFull;
  }
  return null;
}

export function objectKey(req: UploadRequest): string {
  const { ext } = UPLOAD_TYPES[req.contentType as UploadType];
  return `media/${req.sha256.slice(0, 24)}.${ext}`;
}
