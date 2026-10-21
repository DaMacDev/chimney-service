import { EMPTY_MANIFEST, parseManifest, type Manifest } from "./manifest";

/** Cache tag the admin revalidates after every save (#7). */
export const MEDIA_TAG = "media";

export const mediaBaseUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "";

/**
 * Reads the gallery manifest from the public bucket. Cached until the admin
 * revalidates MEDIA_TAG, so visitors never trigger an R2 read for it. Any
 * failure (unset URL, bucket switched off by the usage watchdog, bad JSON)
 * yields an empty gallery instead of breaking the page or the build.
 */
export async function loadManifest(): Promise<Manifest> {
  if (!mediaBaseUrl) return EMPTY_MANIFEST;
  try {
    const res = await fetch(`${mediaBaseUrl.replace(/\/+$/, "")}/manifest.json`, {
      cache: "force-cache",
      // Daily refresh is only a safety net (a build that caught R2 down would
      // otherwise stay empty until the next save): ~120 reads/month.
      next: { tags: [MEDIA_TAG], revalidate: 86400 },
    });
    if (!res.ok) return EMPTY_MANIFEST;
    return parseManifest(await res.json()) ?? EMPTY_MANIFEST;
  } catch {
    return EMPTY_MANIFEST;
  }
}
