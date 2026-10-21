/**
 * Build an Unsplash CDN URL from a photo id. Images are referenced remotely
 * (configured in next.config.ts) rather than committed, so they are easy to
 * swap for your own photo shoot.
 *
 * Unsplash License: free for commercial use, no attribution required.
 */
export function unsplash(id: string, width = 1200): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;
}

/** YouTube thumbnail for a given video id (used by the before/after facades). */
export function youtubeThumb(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
