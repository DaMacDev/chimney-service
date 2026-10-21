import {
  localize,
  mediaUrl,
  type Manifest,
  type MediaFile,
  type MediaItem,
  type PairSide,
} from "./manifest";

/** A manifest entry resolved for one locale: absolute URLs and plain strings. */
export interface ViewMedia {
  id: string;
  kind: MediaFile["kind"];
  src: string;
  poster?: string;
  width: number;
  height: number;
  name?: string;
  caption?: string;
  description?: string;
  /** Accessible name: caption, else name, else the given fallback. */
  label: string;
}

export function viewFile(
  baseUrl: string,
  id: string,
  file: MediaFile,
  text: { name?: string; caption?: string; description?: string },
  fallbackLabel: string,
): ViewMedia {
  return {
    id,
    kind: file.kind,
    src: mediaUrl(baseUrl, file.key),
    poster: file.poster ? mediaUrl(baseUrl, file.poster) : undefined,
    width: file.width,
    height: file.height,
    ...text,
    label: text.caption ?? text.name ?? fallbackLabel,
  };
}

export function viewItem(
  baseUrl: string,
  item: MediaItem,
  locale: string,
  fallbackLabel: string,
): ViewMedia {
  return viewFile(
    baseUrl,
    item.id,
    item.file,
    {
      name: localize(item.name, locale),
      caption: localize(item.caption, locale),
      description: localize(item.description, locale),
    },
    fallbackLabel,
  );
}

export function viewSide(
  baseUrl: string,
  id: string,
  side: PairSide,
  locale: string,
  fallbackLabel: string,
): ViewMedia {
  return viewFile(
    baseUrl,
    id,
    side.file,
    { caption: localize(side.caption, locale) },
    fallbackLabel,
  );
}

/** Labels for media the owner left untitled. */
export interface FallbackLabels {
  item: (number: number) => string;
  before: string;
  after: string;
}

/** The whole manifest resolved for one locale, ready for the gallery components. */
export function viewGallery(
  manifest: Manifest,
  baseUrl: string,
  locale: string,
  labels: FallbackLabels,
) {
  return {
    carousel: manifest.carousel
      .filter((item) => item.file.kind === "image")
      .map((item, i) => viewItem(baseUrl, item, locale, labels.item(i + 1))),
    examples: manifest.examples.map((item, i) =>
      viewItem(baseUrl, item, locale, labels.item(i + 1)),
    ),
    pairs: manifest.pairs.map((pair) => ({
      id: pair.id,
      before: viewSide(baseUrl, `${pair.id}-before`, pair.before, locale, labels.before),
      after: viewSide(baseUrl, `${pair.id}-after`, pair.after, locale, labels.after),
      name: localize(pair.name, locale),
      description: localize(pair.description, locale),
    })),
  };
}
