"use server";

import { updateTag } from "next/cache";
import { getAdminEmail } from "@/lib/admin/auth";
import {
  addItem,
  moveItem,
  orphanedKeys,
  removeItem,
  toItemTexts,
  updateItemTexts,
  type ItemSection,
  type ItemTexts,
} from "@/lib/media/edit";
import { checkUpload, objectKey, UPLOAD_TYPES } from "@/lib/media/limits";
import { MEDIA_TAG } from "@/lib/media/load";
import { parseManifest, type Manifest, type MediaFile } from "@/lib/media/manifest";
import {
  bucketUsage,
  ConflictError,
  deleteObject,
  headObject,
  presignUpload,
  readManifest,
  writeManifest,
} from "@/lib/media/store";

/**
 * Owner-only gallery edits (#7). Every action re-checks the session: Server
 * Actions are public endpoints. Next.js rejects cross-origin action posts.
 */

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const SECTIONS: ItemSection[] = ["carousel", "examples"];
const DENIED = "Tu sesión expiró. Vuelve a iniciar sesión.";
const CONFLICT = "Otro cambio se guardó mientras tanto. Recarga la página e inténtalo de nuevo.";

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

export interface UploadTicket {
  key: string;
  /** Null when the identical file is already stored (no upload needed). */
  url: string | null;
}

/** Checks caps and hands out a 10-minute upload link for one file. */
export async function prepareUpload(req: {
  sha256: string;
  contentType: string;
  bytes: number;
}): Promise<ActionResult<UploadTicket>> {
  if (!(await getAdminEmail())) return fail(DENIED);
  const usage = await bucketUsage();
  const problem = checkUpload(req, usage);
  if (problem) return fail(problem);
  const key = objectKey(req);
  if ((await headObject(key)) !== null) return { ok: true, data: { key, url: null } };
  return { ok: true, data: { key, url: await presignUpload(key, req.contentType, req.bytes) } };
}

/** Re-reads the manifest, applies `edit`, validates, saves and refreshes the site. */
async function save(
  edit: (manifest: Manifest) => Manifest | string,
): Promise<ActionResult<{ before: Manifest; after: Manifest }>> {
  const { manifest, etag } = await readManifest();
  const edited = edit(manifest);
  if (typeof edited === "string") return fail(edited);
  const next = parseManifest({ ...edited, updatedAt: new Date().toISOString() });
  if (!next) return fail("Los datos no son válidos.");
  try {
    await writeManifest(next, etag);
  } catch (err) {
    if (err instanceof ConflictError) return fail(CONFLICT);
    throw err;
  }
  updateTag(MEDIA_TAG);
  return { ok: true, data: { before: manifest, after: next } };
}

/** Confirms an uploaded object exists with the size the browser reported. */
async function verifyFile(file: MediaFile): Promise<string | null> {
  const ext = file.key.split(".").pop();
  const type = Object.values(UPLOAD_TYPES).find((t) => t.ext === ext);
  if (!type || type.kind !== file.kind) return "Tipo de archivo no válido.";
  const size = await headObject(file.key);
  if (size === null || size !== file.bytes)
    return "El archivo no terminó de subirse. Inténtalo de nuevo.";
  if (file.kind === "video") {
    if (!file.poster || (await headObject(file.poster)) === null)
      return "Falta la imagen de portada del video.";
  }
  return null;
}

export async function addMedia(input: {
  section: ItemSection;
  file: MediaFile;
  texts: ItemTexts;
}): Promise<ActionResult> {
  if (!(await getAdminEmail())) return fail(DENIED);
  if (!SECTIONS.includes(input.section)) return fail("Sección no válida.");
  if (input.section === "carousel" && input.file.kind !== "image") {
    return fail("El carrusel solo admite fotos.");
  }
  const problem = await verifyFile(input.file);
  if (problem) return fail(problem);
  const texts = toItemTexts(input.texts);
  if (typeof texts === "string") return fail(texts);

  const result = await save((m) =>
    addItem(m, input.section, { id: crypto.randomUUID(), file: input.file, ...texts }),
  );
  return result.ok ? { ok: true, data: undefined } : result;
}

export async function updateMedia(input: {
  section: ItemSection;
  id: string;
  texts: ItemTexts;
}): Promise<ActionResult> {
  if (!(await getAdminEmail())) return fail(DENIED);
  if (!SECTIONS.includes(input.section)) return fail("Sección no válida.");
  const texts = toItemTexts(input.texts);
  if (typeof texts === "string") return fail(texts);
  const result = await save((m) => updateItemTexts(m, input.section, input.id, texts));
  return result.ok ? { ok: true, data: undefined } : result;
}

export async function moveMedia(input: {
  section: ItemSection;
  id: string;
  direction: -1 | 1;
}): Promise<ActionResult> {
  if (!(await getAdminEmail())) return fail(DENIED);
  if (!SECTIONS.includes(input.section) || ![-1, 1].includes(input.direction)) {
    return fail("Petición no válida.");
  }
  const result = await save((m) => moveItem(m, input.section, input.id, input.direction));
  return result.ok ? { ok: true, data: undefined } : result;
}

/** Removes the entry, then deletes its files if nothing else uses them (deletes are free). */
export async function deleteMedia(input: {
  section: ItemSection;
  id: string;
}): Promise<ActionResult> {
  if (!(await getAdminEmail())) return fail(DENIED);
  if (!SECTIONS.includes(input.section)) return fail("Sección no válida.");
  const result = await save((m) => removeItem(m, input.section, input.id));
  if (!result.ok) return result;
  await Promise.all(orphanedKeys(result.data.before, result.data.after).map(deleteObject));
  return { ok: true, data: undefined };
}
