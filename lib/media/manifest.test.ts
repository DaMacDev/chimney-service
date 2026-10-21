import { describe, it, expect } from "vitest";
import { EMPTY_MANIFEST, localize, mediaUrl, parseManifest } from "./manifest";

const image = { key: "media/abc123.jpg", kind: "image", width: 800, height: 600, bytes: 1000 };
const video = { ...image, key: "media/def456.mp4", kind: "video", poster: "media/abc123.jpg" };

function manifest(overrides: Record<string, unknown> = {}) {
  return {
    ...EMPTY_MANIFEST,
    carousel: [{ id: "a", file: image, caption: { es: "Hola", en: "Hello" } }],
    examples: [{ id: "b", file: video }],
    pairs: [
      { id: "c", before: { file: video }, after: { file: image, caption: { es: "Después" } } },
    ],
    ...overrides,
  };
}

describe("parseManifest", () => {
  it("accepts a well-formed manifest", () => {
    expect(parseManifest(manifest())).not.toBeNull();
  });

  it.each([
    ["not an object", "nope"],
    ["wrong version", manifest({ version: 2 })],
    ["missing list", { ...manifest(), pairs: undefined }],
    [
      "key outside media/",
      manifest({ carousel: [{ id: "a", file: { ...image, key: "../x.jpg" } }] }),
    ],
    [
      "script extension",
      manifest({ carousel: [{ id: "a", file: { ...image, key: "media/a.html" } }] }),
    ],
    ["bad text", manifest({ carousel: [{ id: "a", file: image, caption: { en: "no es" } }] })],
    ["zero size", manifest({ examples: [{ id: "b", file: { ...video, bytes: 0 } }] })],
    ["pair missing after", manifest({ pairs: [{ id: "c", before: { file: video } }] })],
  ])("rejects %s", (_label, input) => {
    expect(parseManifest(input)).toBeNull();
  });
});

describe("localize", () => {
  it("uses English on the EN site when present", () => {
    expect(localize({ es: "Hola", en: "Hello" }, "en")).toBe("Hello");
  });

  it("falls back to Spanish when English is missing or blank", () => {
    expect(localize({ es: "Hola" }, "en")).toBe("Hola");
    expect(localize({ es: "Hola", en: "  " }, "en")).toBe("Hola");
  });

  it("uses Spanish on the ES site", () => {
    expect(localize({ es: "Hola", en: "Hello" }, "es")).toBe("Hola");
  });

  it("returns undefined for no text", () => {
    expect(localize(undefined, "es")).toBeUndefined();
  });
});

describe("mediaUrl", () => {
  it("joins base and key without doubling slashes", () => {
    expect(mediaUrl("https://pub-x.r2.dev/", "media/a.jpg")).toBe(
      "https://pub-x.r2.dev/media/a.jpg",
    );
  });
});
