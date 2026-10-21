/**
 * Owner-managed gallery content, stored as `manifest.json` in the R2 media bucket
 * (ADR 0002). Text is Spanish with optional English; the EN site falls back to
 * Spanish. Every field the owner types is optional.
 */

export interface LocalText {
  es: string;
  en?: string;
}

export interface MediaFile {
  /** Object key in the bucket, e.g. `media/3f9a…c1.jpg`. Immutable: content-hashed. */
  key: string;
  kind: "image" | "video";
  width: number;
  height: number;
  bytes: number;
  /** Video only, and required for video: still frame shown before playback. */
  poster?: string;
}

export interface MediaItem {
  id: string;
  file: MediaFile;
  name?: LocalText;
  caption?: LocalText;
  description?: LocalText;
}

export interface PairSide {
  file: MediaFile;
  caption?: LocalText;
}

export interface BeforeAfterPair {
  id: string;
  before: PairSide;
  after: PairSide;
  name?: LocalText;
  description?: LocalText;
}

export interface Manifest {
  version: 1;
  updatedAt: string;
  carousel: MediaItem[];
  examples: MediaItem[];
  pairs: BeforeAfterPair[];
}

export const EMPTY_MANIFEST: Manifest = {
  version: 1,
  updatedAt: "1970-01-01T00:00:00.000Z",
  carousel: [],
  examples: [],
  pairs: [],
};

/** Text in the visitor's locale, falling back to Spanish. */
export function localize(text: LocalText | undefined, locale: string): string | undefined {
  if (!text) return undefined;
  return (locale === "en" && text.en?.trim()) || text.es;
}

export function mediaUrl(baseUrl: string, key: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${key}`;
}

// --- validation: the manifest is read from storage, so check its shape ---

const KEY_PATTERN = /^media\/[a-z0-9]+\.(jpg|jpeg|png|webp|mp4|webm|mov)$/;

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function isText(v: unknown): v is LocalText {
  return (
    isObject(v) && typeof v.es === "string" && (v.en === undefined || typeof v.en === "string")
  );
}

const optionalText = (v: unknown) => v === undefined || isText(v);

function isFile(v: unknown): v is MediaFile {
  return (
    isObject(v) &&
    typeof v.key === "string" &&
    KEY_PATTERN.test(v.key) &&
    (v.kind === "image" || v.kind === "video") &&
    [v.width, v.height].every(
      (n) => Number.isInteger(n) && (n as number) > 0 && (n as number) <= 20000,
    ) &&
    Number.isInteger(v.bytes) &&
    (v.bytes as number) > 0 &&
    // Videos need a poster: with preload="none" there is no first frame to show.
    (v.kind === "video"
      ? typeof v.poster === "string" && KEY_PATTERN.test(v.poster)
      : v.poster === undefined)
  );
}

function isItem(v: unknown): v is MediaItem {
  return (
    isObject(v) &&
    typeof v.id === "string" &&
    isFile(v.file) &&
    optionalText(v.name) &&
    optionalText(v.caption) &&
    optionalText(v.description)
  );
}

const isSide = (v: unknown): v is PairSide =>
  isObject(v) && isFile(v.file) && optionalText(v.caption);

function isPair(v: unknown): v is BeforeAfterPair {
  return (
    isObject(v) &&
    typeof v.id === "string" &&
    isSide(v.before) &&
    isSide(v.after) &&
    optionalText(v.name) &&
    optionalText(v.description)
  );
}

/** Returns the manifest if it is well-formed, else null. Invalid entries reject the whole file. */
export function parseManifest(json: unknown): Manifest | null {
  if (
    !isObject(json) ||
    json.version !== 1 ||
    typeof json.updatedAt !== "string" ||
    !Array.isArray(json.carousel) ||
    !Array.isArray(json.examples) ||
    !Array.isArray(json.pairs)
  ) {
    return null;
  }
  if (!json.carousel.every(isItem) || !json.examples.every(isItem) || !json.pairs.every(isPair)) {
    return null;
  }
  return json as unknown as Manifest;
}
