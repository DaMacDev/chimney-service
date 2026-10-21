/**
 * Hero / feature imagery. The hero and CTA band use locally AI-generated industrial
 * scenes (no people, commercial-safe SDXL — see CREDITS.md); the About image uses a
 * real job photo. Gallery media itself is owner-managed in R2 (lib/media, ADR 0002).
 */
export const featureImages = {
  hero: "/photos/gen-rooftop-ahu.png",
  cta: "/photos/gen-spiral-ductwork.png",
  about: "/photos/camera-inspection.jpg",
} as const;
