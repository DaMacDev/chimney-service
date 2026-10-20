/**
 * Gallery photos. `src` is a ready-to-use image URL (local real photo in
 * /public/photos); `captionKey` resolves to messages → Gallery.captions.<key>
 * in the active locale.
 *
 * These are the client's own job photos (real crew, real industrial duct/HVAC work).
 */
export interface GalleryImage {
  src: string;
  captionKey: string;
}

export const galleryImages: GalleryImage[] = [
  { src: "/photos/camera-inspection.jpg", captionKey: "cameraInspection" },
  { src: "/photos/mechanical-room.jpg", captionKey: "mechanicalRoom" },
  { src: "/photos/duct-motor.jpg", captionKey: "ductMotor" },
  { src: "/photos/rooftop-ductwork.jpg", captionKey: "rooftopDuctwork" },
  { src: "/photos/rooftop-tech.jpg", captionKey: "rooftopTech" },
  { src: "/photos/team-rooftop.jpg", captionKey: "teamRooftop" },
];

/**
 * Hero / feature imagery. The hero and CTA band use locally AI-generated industrial
 * scenes (no people, commercial-safe SDXL — see CREDITS.md); the About image uses a
 * real job photo.
 */
export const featureImages = {
  hero: "/photos/gen-rooftop-ahu.png",
  cta: "/photos/gen-spiral-ductwork.png",
  about: "/photos/camera-inspection.jpg",
} as const;

/**
 * Before/after cleaning footage shown on the gallery page — self-hosted, trimmed
 * MP4s of a real job. Set `afterSrc` to `null` to show a "coming soon" placeholder
 * in the after cell instead.
 */
export interface CleaningVideo {
  beforeSrc: string;
  beforePoster: string;
  afterSrc: string | null;
  afterPoster: string | null;
}

export const cleaningVideo: CleaningVideo = {
  beforeSrc: "/videos/before-cleaning.mp4",
  beforePoster: "/videos/before-cleaning-poster.jpg",
  afterSrc: "/videos/after-cleaning.mp4",
  afterPoster: "/videos/after-cleaning-poster.jpg",
};

/**
 * "Cleaning examples" on the gallery page: the client's own inspection photos and
 * clips of ducts before cleaning, shown at their natural shape (portrait phone
 * footage would crop badly in the 16:10 carousel). Text resolves to messages →
 * CleaningExamples.items.<key>. Clips are real time, audio stripped.
 */
export type CleaningExample =
  | { kind: "video"; key: string; src: string; poster: string; portrait: boolean }
  | { kind: "image"; key: string; src: string; width: number; height: number };

export const cleaningExamples: CleaningExample[] = [
  {
    kind: "video",
    key: "greaseDuct",
    src: "/videos/cleaning-example-1.mp4",
    poster: "/videos/cleaning-example-1-poster.jpg",
    portrait: false,
  },
  {
    kind: "video",
    key: "dustFloor",
    src: "/videos/cleaning-example-2.mp4",
    poster: "/videos/cleaning-example-2-poster.jpg",
    portrait: true,
  },
  {
    kind: "image",
    key: "ductInterior",
    src: "/photos/duct-interior-1.jpg",
    width: 1203,
    height: 1600,
  },
  {
    kind: "video",
    key: "longRun",
    src: "/videos/cleaning-example-3.mp4",
    poster: "/videos/cleaning-example-3-poster.jpg",
    portrait: true,
  },
  {
    kind: "image",
    key: "ductCloseUp",
    src: "/photos/duct-interior-2.jpg",
    width: 720,
    height: 1600,
  },
];
