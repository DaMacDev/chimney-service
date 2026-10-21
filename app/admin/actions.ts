"use server";

import { updateTag } from "next/cache";
import { getAdminEmail } from "@/lib/admin/auth";
import { adminCopy } from "@/lib/admin/copy";
import {
  addItem,
  addPair as addPairEntry,
  buildPair,
  moveItem,
  orphanedKeys,
  referencedKeys,
  removeItem,
  toItemTexts,
  toPairTexts,
  updateItemTexts,
  updatePairTexts,
  type ItemSection,
  type ItemTexts,
  type PairTexts,
  type Section,
} from "@/lib/media/edit";
import {
  checkUpload,
  landedUsage,
  MEDIA_KEY,
  objectKey,
  POSTER_KEY,
  UPLOAD_TYPES,
  withReservations,
} from "@/lib/media/limits";
import { MEDIA_TAG } from "@/lib/media/load";
import { parseManifest, type Manifest, type MediaFile } from "@/lib/media/manifest";
import {
  ConflictError,
  deleteObject,
  headObject,
  listObjects,
  presignUpload,
  readLedger,
  readManifest,
  uploadHeaders,
  writeLedger,
  writeManifest,
} from "@/lib/media/store";

/**
 * Owner-only gallery edits. Every action re-checks the session: Server
 * Actions are public endpoints. Next.js rejects cross-origin action posts.
 */

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const E = adminCopy.errors;
const SECTIONS: ItemSection[] = ["carousel", "examples"];
const ALL_SECTIONS: Section[] = [...SECTIONS, "pairs"];
/** Unreferenced media older than this is a failed or abandoned upload (links expire in 2 min;
 * a day leaves ample margin for an add racing the sweep). */
const ORPHAN_AGE_MS = 24 * 60 * 60 * 1000;

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

export interface UploadTicket {
  key: string;
  /** Null when the identical file is already stored (no upload needed). */
  url: string | null;
  /** Headers the PUT must carry; they are part of the signature. */
  headers: Record<string, string>;
}

/**
 * Checks caps, reserves the upload in today's ledger and hands out a 2-minute
 * upload link for one file. Also sweeps media left behind by failed uploads.
 */
export async function prepareUpload(req: {
  sha256: string;
  contentType: string;
  bytes: number;
}): Promise<ActionResult<UploadTicket>> {
  if (!(await getAdminEmail())) return fail(E.denied);
  const invalid = checkUpload(req, { totalBytes: 0, uploadsToday: 0 });
  if (invalid) return fail(invalid);

  const now = new Date();
  const [objects, { manifest }, { ledger, etag }] = await Promise.all([
    listObjects(),
    readManifest(),
    readLedger(now),
  ]);
  const used = referencedKeys(manifest);
  const stale = objects.filter(
    (o) =>
      o.key.startsWith("media/") &&
      !used.has(o.key) &&
      now.getTime() - o.lastModified.getTime() > ORPHAN_AGE_MS,
  );
  await Promise.all(stale.map((o) => deleteObject(o.key)));
  const kept = objects.filter((o) => !stale.includes(o));

  const key = objectKey(req);
  const headers = uploadHeaders(req.contentType, req.sha256);
  if (kept.some((o) => o.key === key)) return { ok: true, data: { key, url: null, headers } };

  const problem = checkUpload(req, withReservations(landedUsage(kept, now), ledger));
  if (problem) return fail(problem);
  try {
    await writeLedger({ count: ledger.count + 1, bytes: ledger.bytes + req.bytes }, etag, now);
  } catch (err) {
    if (err instanceof ConflictError) return fail(adminCopy.genericError);
    throw err;
  }
  const url = await presignUpload(key, req.contentType, req.bytes, req.sha256);
  return { ok: true, data: { key, url, headers } };
}

/** Re-reads the manifest, applies `edit`, validates, saves and refreshes the site. */
async function save(
  edit: (manifest: Manifest) => Manifest | string,
): Promise<ActionResult<{ before: Manifest; after: Manifest }>> {
  const { manifest, etag } = await readManifest();
  const edited = edit(manifest);
  if (typeof edited === "string") return fail(edited);
  // Nothing changed (e.g. moving the first item up): skip the write and its history copy.
  if (edited === manifest) return { ok: true, data: { before: manifest, after: manifest } };
  const next = parseManifest({ ...edited, updatedAt: new Date().toISOString() });
  if (!next) return fail(E.invalidData);
  try {
    await writeManifest(next, etag);
  } catch (err) {
    if (err instanceof ConflictError) return fail(E.conflict);
    throw err;
  }
  updateTag(MEDIA_TAG);
  return { ok: true, data: { before: manifest, after: next } };
}

const isDimension = (n: unknown) => Number.isInteger(n) && (n as number) > 0;

/**
 * Validates the browser's file description field by field (no extra fields
 * reach the public manifest) and confirms the objects landed at that size.
 */
async function verifyFile(input: MediaFile): Promise<MediaFile | string> {
  const { key, kind, width, height, bytes, poster } = input ?? {};
  if (typeof key !== "string" || !MEDIA_KEY.test(key)) return E.invalidType;
  const type = Object.values(UPLOAD_TYPES).find((t) => t.ext === key.split(".").pop());
  if (!type || type.kind !== kind) return E.invalidType;
  if (!isDimension(width) || !isDimension(height) || !isDimension(bytes)) return E.invalidData;
  if (kind === "video" && (typeof poster !== "string" || !POSTER_KEY.test(poster))) {
    return E.missingPoster;
  }
  if (kind === "image" && poster !== undefined) return E.invalidData;

  if ((await headObject(key)) !== bytes) return E.notUploaded;
  if (poster && (await headObject(poster)) === null) return E.missingPoster;
  return { key, kind, width, height, bytes, ...(poster ? { poster } : {}) };
}

export async function addMedia(input: {
  section: ItemSection;
  file: MediaFile;
  texts: ItemTexts;
}): Promise<ActionResult> {
  if (!(await getAdminEmail())) return fail(E.denied);
  if (!SECTIONS.includes(input.section)) return fail(E.invalidRequest);
  if (input.section === "carousel" && input.file?.kind !== "image") {
    return fail(E.carouselPhotosOnly);
  }
  const file = await verifyFile(input.file);
  if (typeof file === "string") return fail(file);
  const texts = toItemTexts(input.texts);
  if (typeof texts === "string") return fail(texts);

  const result = await save((m) =>
    addItem(m, input.section, { id: crypto.randomUUID(), file, ...texts }),
  );
  return result.ok ? { ok: true, data: undefined } : result;
}

export async function updateMedia(input: {
  section: ItemSection;
  id: string;
  texts: ItemTexts;
}): Promise<ActionResult> {
  if (!(await getAdminEmail())) return fail(E.denied);
  if (!SECTIONS.includes(input.section)) return fail(E.invalidRequest);
  const texts = toItemTexts(input.texts);
  if (typeof texts === "string") return fail(texts);
  const result = await save((m) => updateItemTexts(m, input.section, input.id, texts));
  return result.ok ? { ok: true, data: undefined } : result;
}

/** Adds a before/after pair; both files are required, photo or video in any mix. */
export async function addPair(input: {
  before: MediaFile;
  after: MediaFile;
  texts: PairTexts;
}): Promise<ActionResult> {
  if (!(await getAdminEmail())) return fail(E.denied);
  const before = await verifyFile(input.before);
  if (typeof before === "string") return fail(before);
  const after = await verifyFile(input.after);
  if (typeof after === "string") return fail(after);
  const texts = toPairTexts(input.texts);
  if (typeof texts === "string") return fail(texts);

  const result = await save((m) =>
    addPairEntry(m, buildPair(crypto.randomUUID(), before, after, texts)),
  );
  return result.ok ? { ok: true, data: undefined } : result;
}

export async function updatePair(input: { id: string; texts: PairTexts }): Promise<ActionResult> {
  if (!(await getAdminEmail())) return fail(E.denied);
  const texts = toPairTexts(input.texts);
  if (typeof texts === "string") return fail(texts);
  const result = await save((m) => updatePairTexts(m, input.id, texts));
  return result.ok ? { ok: true, data: undefined } : result;
}

export async function moveMedia(input: {
  section: Section;
  id: string;
  direction: -1 | 1;
}): Promise<ActionResult> {
  if (!(await getAdminEmail())) return fail(E.denied);
  if (!ALL_SECTIONS.includes(input.section) || ![-1, 1].includes(input.direction)) {
    return fail(E.invalidRequest);
  }
  const result = await save((m) => moveItem(m, input.section, input.id, input.direction));
  return result.ok ? { ok: true, data: undefined } : result;
}

/** Removes the entry, then deletes its files if nothing else uses them (deletes are free). */
export async function deleteMedia(input: { section: Section; id: string }): Promise<ActionResult> {
  if (!(await getAdminEmail())) return fail(E.denied);
  if (!ALL_SECTIONS.includes(input.section)) return fail(E.invalidRequest);
  const result = await save((m) => removeItem(m, input.section, input.id));
  if (!result.ok) return result;
  // Re-read: an add of the identical file may have re-referenced a key meanwhile.
  const stillUsed = referencedKeys((await readManifest()).manifest);
  const gone = orphanedKeys(result.data.before, result.data.after).filter((k) => !stillUsed.has(k));
  // Best-effort: the entry is already gone; prepareUpload sweeps anything left behind.
  await Promise.allSettled(gone.map(deleteObject));
  return { ok: true, data: undefined };
}
