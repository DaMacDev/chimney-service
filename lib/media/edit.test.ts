import { describe, it, expect } from "vitest";
import {
  addItem,
  addPair,
  buildPair,
  moveItem,
  orphanedKeys,
  removeItem,
  toItemTexts,
  toPairTexts,
  updateItemTexts,
  updatePairTexts,
} from "./edit";
import {
  checkUpload,
  landedUsage,
  objectKey,
  withReservations,
  MAX_UPLOADS_PER_DAY,
  STORAGE_BUDGET_BYTES,
  MB,
} from "./limits";
import { EMPTY_MANIFEST, type Manifest, type MediaItem } from "./manifest";

const file = (key: string) => ({ key, kind: "image" as const, width: 10, height: 10, bytes: 5 });
const item = (id: string, key = `media/${id}.jpg`): MediaItem => ({ id, file: file(key) });
const sha = "a".repeat(64);
/** Narrows an edit result that must have succeeded. */
const ok = (result: Manifest | string): Manifest => {
  if (typeof result === "string") throw new Error(result);
  return result;
};

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

  it("refuses over-long text and accepts the exact limit", () => {
    expect(toItemTexts({ name: { es: "x".repeat(121) } })).toMatch(/120/);
    expect(toItemTexts({ name: { es: "x".repeat(120) } })).toEqual({
      name: { es: "x".repeat(120) },
    });
  });
});

describe("manifest edits", () => {
  const base = { ...EMPTY_MANIFEST, carousel: [item("a"), item("b"), item("c")] };

  it("adds to the end of a section", () => {
    expect(addItem(base, "examples", item("x")).examples.map((i) => i.id)).toEqual(["x"]);
  });

  it("moves an item and ignores moves past either end", () => {
    expect(ok(moveItem(base, "carousel", "b", -1)).carousel.map((i) => i.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
    expect(moveItem(base, "carousel", "a", -1)).toBe(base);
    expect(moveItem(base, "carousel", "c", 1)).toBe(base);
  });

  it("replaces texts without touching the file", () => {
    const next = updateItemTexts(base, "carousel", "a", { caption: { es: "Hola" } });
    expect(ok(next).carousel[0]).toEqual({ ...item("a"), caption: { es: "Hola" } });
  });

  it("reports only files no other entry still uses", () => {
    const shared = {
      ...EMPTY_MANIFEST,
      carousel: [item("a"), item("b", "media/shared.jpg")],
      examples: [item("c", "media/shared.jpg")],
    };
    expect(orphanedKeys(shared, ok(removeItem(shared, "carousel", "a")))).toEqual(["media/a.jpg"]);
    expect(orphanedKeys(shared, ok(removeItem(shared, "carousel", "b")))).toEqual([]);
  });

  it("reports a video's poster and keeps keys a pair still uses", () => {
    const video: MediaItem = {
      id: "v",
      file: { ...file("media/v.mp4"), kind: "video", poster: "media/vp.jpg" },
    };
    const withPair = {
      ...EMPTY_MANIFEST,
      examples: [video, item("p")],
      pairs: [
        { id: "pair", before: { file: file("media/p.jpg") }, after: { file: file("media/q.jpg") } },
      ],
    };
    expect(orphanedKeys(withPair, ok(removeItem(withPair, "examples", "v")))).toEqual([
      "media/v.mp4",
      "media/vp.jpg",
    ]);
    expect(orphanedKeys(withPair, ok(removeItem(withPair, "examples", "p")))).toEqual([]);
  });

  it("refuses edits to an item that no longer exists", () => {
    expect(updateItemTexts(base, "carousel", "gone", {})).toMatch(/ya no existe/);
    expect(moveItem(base, "carousel", "gone", 1)).toMatch(/ya no existe/);
    expect(removeItem(base, "carousel", "gone")).toMatch(/ya no existe/);
  });
});

describe("upload reservations", () => {
  const now = new Date("2026-10-21T12:00:00Z");
  const obj = (key: string, bytes: number, iso: string) => ({
    key,
    bytes,
    lastModified: new Date(iso),
  });
  const landed = landedUsage(
    [
      obj("media/old.jpg", 100, "2026-10-20T23:00:00Z"),
      obj("media/new.jpg", 50, "2026-10-21T01:00:00Z"),
      obj("manifest.json", 5, "2026-10-21T02:00:00Z"),
    ],
    now,
  );

  it("counts only today's media as today's uploads", () => {
    expect(landed).toEqual({ totalBytes: 155, uploadsToday: 1, bytesToday: 50 });
  });

  it("counts reserved-but-not-landed bytes and never hands deleted slots back", () => {
    expect(withReservations(landed, { count: 4, bytes: 250 })).toEqual({
      totalBytes: 355,
      uploadsToday: 4,
    });
    expect(withReservations(landed, { count: 0, bytes: 0 })).toEqual({
      totalBytes: 155,
      uploadsToday: 1,
    });
  });
});

describe("pair edits", () => {
  const pair = buildPair("p", file("media/b.jpg"), file("media/a.mp4"), {
    beforeCaption: { es: "Sucio" },
  });
  const base = {
    ...EMPTY_MANIFEST,
    pairs: [pair, buildPair("q", file("media/c.jpg"), file("media/d.jpg"), {})],
  };

  it("builds a pair leaving absent texts out", () => {
    expect(pair).toEqual({
      id: "p",
      before: { file: file("media/b.jpg"), caption: { es: "Sucio" } },
      after: { file: file("media/a.mp4") },
    });
  });

  it("cleans pair texts with the caption limit on each side", () => {
    expect(toPairTexts({ afterCaption: { es: "  Limpio " }, name: {} })).toEqual({
      afterCaption: { es: "Limpio" },
    });
    expect(toPairTexts({ beforeCaption: { es: "x".repeat(301) } })).toMatch(/300/);
  });

  it("adds, retitles, moves and removes pairs, keeping files", () => {
    expect(addPair(EMPTY_MANIFEST, pair).pairs).toEqual([pair]);
    const renamed = ok(updatePairTexts(base, "p", { name: { es: "Campana" } }));
    expect(renamed.pairs[0]).toEqual({
      id: "p",
      before: { file: pair.before.file },
      after: { file: pair.after.file },
      name: { es: "Campana" },
    });
    expect(ok(moveItem(base, "pairs", "q", -1)).pairs.map((p) => p.id)).toEqual(["q", "p"]);
    expect(orphanedKeys(base, ok(removeItem(base, "pairs", "p")))).toEqual([
      "media/b.jpg",
      "media/a.mp4",
    ]);
    expect(updatePairTexts(base, "gone", {})).toMatch(/ya no existe/);
  });
});
