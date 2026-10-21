import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminCopy } from "@/lib/admin/copy";
import { EMPTY_MANIFEST, type Manifest, type MediaFile } from "@/lib/media/manifest";
import { addMedia, addPair, deleteMedia, moveMedia, updatePair } from "./actions";

const auth = vi.hoisted(() => ({ getAdminEmail: vi.fn() }));
vi.mock("@/lib/admin/auth", () => auth);
vi.mock("next/cache", () => ({ updateTag: vi.fn() }));
const store = vi.hoisted(() => ({
  ConflictError: class extends Error {},
  readManifest: vi.fn(),
  writeManifest: vi.fn(),
  headObject: vi.fn(),
  deleteObject: vi.fn(),
  listObjects: vi.fn(),
  readLedger: vi.fn(),
  writeLedger: vi.fn(),
  presignUpload: vi.fn(),
  uploadHeaders: vi.fn(),
}));
vi.mock("@/lib/media/store", () => store);

const E = adminCopy.errors;
const photo = (hex: string): MediaFile => ({
  key: `media/${hex.repeat(24)}.jpg`,
  kind: "image",
  width: 10,
  height: 10,
  bytes: 5,
});
const existing: Manifest = {
  ...EMPTY_MANIFEST,
  pairs: [{ id: "p", before: { file: photo("a") }, after: { file: photo("b") } }],
};

beforeEach(() => {
  vi.resetAllMocks();
  auth.getAdminEmail.mockResolvedValue("owner@example.com");
  store.readManifest.mockResolvedValue({ manifest: existing, etag: "e1" });
  store.headObject.mockResolvedValue(5);
});

describe("admin actions", () => {
  it("refuses every action without a session and writes nothing", async () => {
    auth.getAdminEmail.mockResolvedValue(null);
    const results = await Promise.all([
      addPair({ before: photo("c"), after: photo("d"), texts: {} }),
      updatePair({ id: "p", texts: {} }),
      moveMedia({ section: "pairs", id: "p", direction: 1 }),
      deleteMedia({ section: "pairs", id: "p" }),
    ]);
    expect(results).toEqual(results.map(() => ({ ok: false, error: E.denied })));
    expect(store.writeManifest).not.toHaveBeenCalled();
  });

  it("refuses unknown sections, and pairs on the single-item paths", async () => {
    // @ts-expect-error -- a crafted request
    expect(await moveMedia({ section: "manifest", id: "p", direction: 1 })).toEqual({
      ok: false,
      error: E.invalidRequest,
    });
    // @ts-expect-error -- a crafted request
    expect(await addMedia({ section: "pairs", file: photo("c"), texts: {} })).toMatchObject({
      ok: false,
    });
    expect(store.writeManifest).not.toHaveBeenCalled();
  });

  it("writes nothing when one side of a pair is invalid", async () => {
    const result = await addPair({
      before: photo("c"),
      after: { ...photo("d"), key: "manifest.json" },
      texts: {},
    });
    expect(result).toEqual({ ok: false, error: E.invalidType });
    expect(store.writeManifest).not.toHaveBeenCalled();
  });

  it("saves a pair with only the verified file fields", async () => {
    const tampered = { ...photo("d"), extra: "x" } as MediaFile;
    const result = await addPair({
      before: photo("c"),
      after: tampered,
      texts: { afterCaption: { es: "Limpio" } },
    });
    expect(result).toEqual({ ok: true, data: undefined });
    const [saved, etag] = store.writeManifest.mock.calls[0];
    expect(etag).toBe("e1");
    expect(saved.pairs[1].before).toEqual({ file: photo("c") });
    expect(saved.pairs[1].after).toEqual({ file: photo("d"), caption: { es: "Limpio" } });
  });

  it("treats malformed text input as empty instead of crashing", async () => {
    const texts = { name: { es: 5 } } as unknown as { name: { es: string } };
    expect(await updatePair({ id: "p", texts })).toEqual({ ok: true, data: undefined });
  });

  it("deletes a removed pair's files unless the fresh manifest still uses them", async () => {
    store.readManifest
      .mockResolvedValueOnce({ manifest: existing, etag: "e1" })
      .mockResolvedValueOnce({
        manifest: { ...EMPTY_MANIFEST, examples: [{ id: "x", file: photo("a") }] },
        etag: "e2",
      });
    expect(await deleteMedia({ section: "pairs", id: "p" })).toEqual({ ok: true, data: undefined });
    expect(store.deleteObject.mock.calls.map(([key]) => key)).toEqual([photo("b").key]);
  });
});
