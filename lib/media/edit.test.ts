import { describe, it, expect } from "vitest";
import { addItem, moveItem, orphanedKeys, removeItem, toItemTexts, updateItemTexts } from "./edit";
import { checkUpload, objectKey, MAX_UPLOADS_PER_DAY, STORAGE_BUDGET_BYTES, MB } from "./limits";
import { EMPTY_MANIFEST, type MediaItem } from "./manifest";

const file = (key: string) => ({ key, kind: "image" as const, width: 10, height: 10, bytes: 5 });
const item = (id: string, key = `media/${id}.jpg`): MediaItem => ({ id, file: file(key) });
const sha = "a".repeat(64);

describe("checkUpload", () => {
  const empty = { totalBytes: 0, uploadsToday: 0 };

  it("accepts a normal photo", () => {
    expect(checkUpload({ sha256: sha, contentType: "image/jpeg", bytes: MB }, empty)).toBeNull();
  });

  it.each([
    ["unknown type", { contentType: "image/gif", bytes: MB }, empty],
    ["photo over 10 MB", { contentType: "image/jpeg", bytes: 11 * MB }, empty],
    ["video over 50 MB", { contentType: "video/mp4", bytes: 51 * MB }, empty],
    ["empty file", { contentType: "video/mp4", bytes: 0 }, empty],
    [
      "daily cap",
      { contentType: "image/jpeg", bytes: MB },
      { totalBytes: 0, uploadsToday: MAX_UPLOADS_PER_DAY },
    ],
    [
      "storage budget",
      { contentType: "video/mp4", bytes: 2 * MB },
      { totalBytes: STORAGE_BUDGET_BYTES - MB, uploadsToday: 0 },
    ],
  ])("refuses %s", (_label, req, usage) => {
    expect(checkUpload({ sha256: sha, ...req }, usage)).toMatch(/\S/);
  });

  it("refuses a malformed hash", () => {
    expect(checkUpload({ sha256: "../x", contentType: "image/jpeg", bytes: 1 }, empty)).toMatch(
      /inválido/,
    );
  });

  it("derives a content-addressed key", () => {
    expect(objectKey({ sha256: sha, contentType: "video/quicktime", bytes: 1 })).toBe(
      `media/${"a".repeat(24)}.mov`,
    );
  });
});

describe("toItemTexts", () => {
  it("trims, drops empty fields and keeps optional English", () => {
    expect(
      toItemTexts({
        name: { es: "  Campana  " },
        caption: { es: "Antes", en: "Before" },
        description: {},
      }),
    ).toEqual({ name: { es: "Campana" }, caption: { es: "Antes", en: "Before" } });
  });

  it("refuses English without Spanish", () => {
    expect(toItemTexts({ caption: { en: "Before" } })).toMatch(/español/);
  });

  it("refuses over-long text", () => {
    expect(toItemTexts({ name: { es: "x".repeat(121) } })).toMatch(/120/);
  });
});

describe("manifest edits", () => {
  const base = { ...EMPTY_MANIFEST, carousel: [item("a"), item("b"), item("c")] };

  it("adds to the end of a section", () => {
    expect(addItem(base, "examples", item("x")).examples.map((i) => i.id)).toEqual(["x"]);
  });

  it("moves an item and ignores moves past either end", () => {
    expect(moveItem(base, "carousel", "b", -1).carousel.map((i) => i.id)).toEqual(["b", "a", "c"]);
    expect(moveItem(base, "carousel", "a", -1)).toBe(base);
    expect(moveItem(base, "carousel", "c", 1)).toBe(base);
  });

  it("replaces texts without touching the file", () => {
    const next = updateItemTexts(base, "carousel", "a", { caption: { es: "Hola" } });
    expect(next.carousel[0]).toEqual({ ...item("a"), caption: { es: "Hola" } });
  });

  it("reports only files no other entry still uses", () => {
    const shared = {
      ...EMPTY_MANIFEST,
      carousel: [item("a"), item("b", "media/shared.jpg")],
      examples: [item("c", "media/shared.jpg")],
    };
    expect(orphanedKeys(shared, removeItem(shared, "carousel", "a"))).toEqual(["media/a.jpg"]);
    expect(orphanedKeys(shared, removeItem(shared, "carousel", "b"))).toEqual([]);
  });
});
