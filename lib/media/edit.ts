/**
 * Pure manifest edits used by the admin actions. Each returns a new manifest;
 * the caller validates and saves it.
 */
import { adminCopy } from "@/lib/admin/copy";
import { TEXT_LIMITS } from "./limits";
import type { BeforeAfterPair, LocalText, Manifest, MediaFile, MediaItem } from "./manifest";

/** Sections holding single photos/videos. */
export type ItemSection = "carousel" | "examples";
/** Every orderable list in the manifest. */
export type Section = ItemSection | "pairs";

export interface TextInput {
  es?: string;
  en?: string;
}

export interface ItemTexts {
  name?: TextInput;
  caption?: TextInput;
  description?: TextInput;
}

export interface PairTexts {
  name?: TextInput;
  description?: TextInput;
  beforeCaption?: TextInput;
  afterCaption?: TextInput;
}

type CleanPairTexts = Partial<Record<keyof PairTexts, LocalText>>;

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

/** Like toItemTexts for a pair; side captions share the caption limit. */
export function toPairTexts(texts: PairTexts): CleanPairTexts | string {
  const out: CleanPairTexts = {};
  const limit = {
    name: "name",
    description: "description",
    beforeCaption: "caption",
    afterCaption: "caption",
  } as const;
  for (const field of ["name", "beforeCaption", "afterCaption", "description"] as const) {
    const value = toLocalText(texts[field], limit[field]);
    if (typeof value === "string") return value;
    if (value) out[field] = value;
  }
  return out;
}

/** Builds a pair from its two files and cleaned texts (absent texts are left out). */
export function buildPair(
  id: string,
  before: MediaFile,
  after: MediaFile,
  texts: CleanPairTexts,
): BeforeAfterPair {
  return {
    id,
    before: { file: before, ...(texts.beforeCaption ? { caption: texts.beforeCaption } : {}) },
    after: { file: after, ...(texts.afterCaption ? { caption: texts.afterCaption } : {}) },
    ...(texts.name ? { name: texts.name } : {}),
    ...(texts.description ? { description: texts.description } : {}),
  };
}

export function addPair(manifest: Manifest, pair: BeforeAfterPair): Manifest {
  return { ...manifest, pairs: [...manifest.pairs, pair] };
}

/** Replaces a pair's texts, keeping both files. */
export function updatePairTexts(
  manifest: Manifest,
  id: string,
  texts: CleanPairTexts,
): Manifest | string {
  const pair = manifest.pairs.find((p) => p.id === id);
  if (!pair) return adminCopy.errors.notFound;
  const next = buildPair(id, pair.before.file, pair.after.file, texts);
  return { ...manifest, pairs: manifest.pairs.map((p) => (p.id === id ? next : p)) };
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
  section: Section,
  id: string,
  direction: -1 | 1,
): Manifest | string {
  const items: { id: string }[] = [...manifest[section]];
  const from = items.findIndex((item) => item.id === id);
  if (from < 0) return adminCopy.errors.notFound;
  const to = from + direction;
  if (to < 0 || to >= items.length) return manifest;
  [items[from], items[to]] = [items[to], items[from]];
  return { ...manifest, [section]: items };
}

export function removeItem(manifest: Manifest, section: Section, id: string): Manifest | string {
  const items: { id: string }[] = manifest[section];
  if (!items.some((item) => item.id === id)) return adminCopy.errors.notFound;
  return { ...manifest, [section]: items.filter((item) => item.id !== id) };
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
