/**
 * Pure manifest edits used by the admin actions. Each returns a new manifest;
 * the caller validates and saves it.
 */
import { adminCopy } from "@/lib/admin/copy";
import { TEXT_LIMITS } from "./limits";
import type { LocalText, Manifest, MediaFile, MediaItem } from "./manifest";

/** Sections the admin edits in #7 (before/after pairs come in #9). */
export type ItemSection = "carousel" | "examples";

export interface TextInput {
  es?: string;
  en?: string;
}

export interface ItemTexts {
  name?: TextInput;
  caption?: TextInput;
  description?: TextInput;
}

/** Trims and checks one field. Empty = absent; English needs Spanish. */
export function toLocalText(
  input: TextInput | undefined,
  field: keyof typeof TEXT_LIMITS,
): LocalText | undefined | string {
  const es = input?.es?.trim() ?? "";
  const en = input?.en?.trim() ?? "";
  const max = TEXT_LIMITS[field];
  if (es.length > max || en.length > max) return adminCopy.errors.tooLong(max);
  if (!es && en) return adminCopy.errors.needSpanish;
  if (!es) return undefined;
  return en ? { es, en } : { es };
}

/** Converts form texts; returns an error string for the first invalid field. */
export function toItemTexts(
  texts: ItemTexts,
): Pick<MediaItem, "name" | "caption" | "description"> | string {
  const out: Pick<MediaItem, "name" | "caption" | "description"> = {};
  for (const field of ["name", "caption", "description"] as const) {
    const value = toLocalText(texts[field], field);
    if (typeof value === "string") return value;
    if (value) out[field] = value;
  }
  return out;
}

export function addItem(manifest: Manifest, section: ItemSection, item: MediaItem): Manifest {
  return { ...manifest, [section]: [...manifest[section], item] };
}

export function updateItemTexts(
  manifest: Manifest,
  section: ItemSection,
  id: string,
  texts: Pick<MediaItem, "name" | "caption" | "description">,
): Manifest | string {
  if (!manifest[section].some((item) => item.id === id)) return adminCopy.errors.notFound;
  return {
    ...manifest,
    [section]: manifest[section].map((item) =>
      item.id === id ? { id: item.id, file: item.file, ...texts } : item,
    ),
  };
}

export function moveItem(
  manifest: Manifest,
  section: ItemSection,
  id: string,
  direction: -1 | 1,
): Manifest | string {
  const items = [...manifest[section]];
  const from = items.findIndex((item) => item.id === id);
  if (from < 0) return adminCopy.errors.notFound;
  const to = from + direction;
  if (to < 0 || to >= items.length) return manifest;
  [items[from], items[to]] = [items[to], items[from]];
  return { ...manifest, [section]: items };
}

export function removeItem(
  manifest: Manifest,
  section: ItemSection,
  id: string,
): Manifest | string {
  if (!manifest[section].some((item) => item.id === id)) return adminCopy.errors.notFound;
  return { ...manifest, [section]: manifest[section].filter((item) => item.id !== id) };
}

function fileKeys(file: MediaFile): string[] {
  return file.poster ? [file.key, file.poster] : [file.key];
}

/** Every object key the manifest still uses. */
export function referencedKeys(manifest: Manifest): Set<string> {
  const keys = new Set<string>();
  for (const item of [...manifest.carousel, ...manifest.examples]) {
    fileKeys(item.file).forEach((k) => keys.add(k));
  }
  for (const pair of manifest.pairs) {
    [...fileKeys(pair.before.file), ...fileKeys(pair.after.file)].forEach((k) => keys.add(k));
  }
  return keys;
}

/** Keys used by `before` that `after` no longer references: safe to delete. */
export function orphanedKeys(before: Manifest, after: Manifest): string[] {
  const still = referencedKeys(after);
  return [...referencedKeys(before)].filter((k) => !still.has(k));
}
