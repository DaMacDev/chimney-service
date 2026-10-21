import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { adminCopy } from "@/lib/admin/copy";
import { MediaManager, type ManagedItem } from "./MediaManager";

const actions = vi.hoisted(() => ({
  prepareUpload: vi.fn(),
  addMedia: vi.fn(),
  addPair: vi.fn(),
  updateMedia: vi.fn(),
  updatePair: vi.fn(),
  moveMedia: vi.fn(),
  deleteMedia: vi.fn(),
}));
vi.mock("@/app/admin/actions", () => actions);
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
const prepareFile = vi.hoisted(() => vi.fn());
vi.mock("@/lib/admin/prepare-file", () => ({ prepareFile }));

const item = (id: string, name: string): ManagedItem => ({
  id,
  thumbs: [{ src: `https://media.test/media/${id}.jpg`, kind: "image" }],
  texts: { name: { es: name } },
});

const renderManager = (items: ManagedItem[], section: "examples" | "pairs" = "examples") =>
  render(
    <MediaManager
      section={section}
      items={items}
      copy={{ accept: "image/*", hint: "Pista", addTitle: "Agregar", emptyBody: "Vacío" }}
    />,
  );

const photo = (name = "foto.jpg") => new File(["x"], name, { type: "image/jpeg" });
const prepared = (sha: string) => ({
  main: { blob: new Blob(["x"]), contentType: "image/jpeg", sha256: sha, width: 1, height: 1 },
});

async function chooseFile() {
  await userEvent.upload(screen.getByLabelText(adminCopy.fileLabel), photo());
}

beforeEach(() => vi.resetAllMocks());

describe("MediaManager", () => {
  it("shows the empty state", () => {
    renderManager([]);
    expect(screen.getByText(adminCopy.emptyTitle)).toBeInTheDocument();
  });

  it("names each row's edit button after its item", () => {
    renderManager([item("a", "Campana"), item("b", "Ducto")]);
    expect(screen.getByRole("button", { name: `${adminCopy.edit}: Campana` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `${adminCopy.edit}: Ducto` })).toBeInTheDocument();
  });

  it("disables upload while one is running, so a double click adds once", async () => {
    let finish!: (v: unknown) => void;
    prepareFile.mockReturnValue(new Promise((r) => (finish = r)));
    renderManager([]);
    await chooseFile();
    const upload = screen.getByRole("button", { name: adminCopy.upload });
    await userEvent.click(upload);
    expect(upload).toBeDisabled();
    await userEvent.click(upload);
    expect(prepareFile).toHaveBeenCalledTimes(1);
    finish({
      main: {
        blob: new Blob(["x"]),
        contentType: "image/jpeg",
        sha256: "a".repeat(64),
        width: 1,
        height: 1,
      },
    });
    actions.prepareUpload.mockResolvedValue({
      ok: true,
      data: { key: "media/k.jpg", url: null, headers: {} },
    });
    actions.addMedia.mockResolvedValue({ ok: true, data: undefined });
    expect(await screen.findByText(adminCopy.uploaded)).toBeInTheDocument();
    expect(upload).toBeEnabled();
  });

  it("shows the Spanish generic message when a server action throws", async () => {
    prepareFile.mockResolvedValue({
      main: {
        blob: new Blob(["x"]),
        contentType: "image/jpeg",
        sha256: "a".repeat(64),
        width: 1,
        height: 1,
      },
    });
    actions.prepareUpload.mockRejectedValue(new Error("Saving manifest.json failed: 500"));
    renderManager([]);
    await chooseFile();
    await userEvent.click(screen.getByRole("button", { name: adminCopy.upload }));
    expect(await screen.findByRole("alert")).toHaveTextContent(adminCopy.genericError);
  });

  it("refuses an oversized video before reading it", async () => {
    renderManager([]);
    const video = new File(["x"], "clip.mp4", { type: "video/mp4" });
    Object.defineProperty(video, "size", { value: 51 * 1024 * 1024 });
    await userEvent.upload(screen.getByLabelText(adminCopy.fileLabel), video, {
      applyAccept: false,
    });
    await userEvent.click(screen.getByRole("button", { name: adminCopy.upload }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/50 MB/);
    expect(prepareFile).not.toHaveBeenCalled();
  });

  it("requires both files for a pair", async () => {
    renderManager([], "pairs");
    await userEvent.upload(screen.getByLabelText(adminCopy.beforeFile), photo());
    await userEvent.click(screen.getByRole("button", { name: adminCopy.upload }));
    expect(await screen.findByRole("alert")).toHaveTextContent(adminCopy.chooseBothFiles);
    expect(prepareFile).not.toHaveBeenCalled();
  });

  it("uploads both sides and adds them as one pair", async () => {
    prepareFile.mockResolvedValueOnce(prepared("b".repeat(64)));
    prepareFile.mockResolvedValueOnce(prepared("c".repeat(64)));
    actions.prepareUpload.mockImplementation(async ({ sha256 }: { sha256: string }) => ({
      ok: true,
      data: { key: `media/${sha256.slice(0, 24)}.jpg`, url: null, headers: {} },
    }));
    actions.addPair.mockResolvedValue({ ok: true, data: undefined });
    renderManager([], "pairs");
    // Regression: an earlier "choose both files" error must not lose the files chosen after it.
    await userEvent.click(screen.getByRole("button", { name: adminCopy.upload }));
    await screen.findByRole("alert");
    // Button ignores a second click within 400 ms (single-flight); a person is slower.
    await new Promise((r) => setTimeout(r, 450));
    await userEvent.upload(screen.getByLabelText(adminCopy.beforeFile), photo("antes.jpg"));
    await userEvent.upload(screen.getByLabelText(adminCopy.afterFile), photo("despues.jpg"));
    await userEvent.type(
      screen.getByLabelText(`${adminCopy.beforeCaption} (${adminCopy.optional})`),
      "Sucio",
    );
    await userEvent.click(screen.getByRole("button", { name: adminCopy.upload }));
    expect(await screen.findByText(adminCopy.uploaded)).toBeInTheDocument();
    const [{ before, after, texts }] = actions.addPair.mock.calls[0];
    expect(before.key).toBe(`media/${"b".repeat(24)}.jpg`);
    expect(after.key).toBe(`media/${"c".repeat(24)}.jpg`);
    expect(texts.beforeCaption).toEqual({ es: "Sucio" });
    expect(actions.addMedia).not.toHaveBeenCalled();
  });

  it("shows both sides of a pair in its row", () => {
    renderManager(
      [
        {
          id: "p",
          thumbs: [
            { src: "https://media.test/b.jpg", kind: "image", label: adminCopy.before },
            { src: "https://media.test/a.jpg", kind: "image", label: adminCopy.after },
          ],
          texts: { name: { es: "Campana" } },
        },
      ],
      "pairs",
    );
    const row = screen.getByRole("listitem");
    expect(within(row).getByText(adminCopy.before)).toBeInTheDocument();
    expect(within(row).getByText(adminCopy.after)).toBeInTheDocument();
  });

  it("discards unsaved edits on cancel", async () => {
    renderManager([item("a", "Campana")]);
    await userEvent.click(screen.getByRole("button", { name: `${adminCopy.edit}: Campana` }));
    const nameLabel = `${adminCopy.name} (${adminCopy.optional})`;
    const name = within(screen.getByRole("listitem")).getByLabelText(nameLabel);
    await userEvent.clear(name);
    await userEvent.type(name, "Otro");
    await userEvent.click(screen.getByRole("button", { name: adminCopy.cancel }));
    await userEvent.click(screen.getByRole("button", { name: `${adminCopy.edit}: Campana` }));
    expect(within(screen.getByRole("listitem")).getByLabelText(nameLabel)).toHaveValue("Campana");
  });

  it("asks before deleting and deletes nothing on cancel", async () => {
    renderManager([item("a", "Campana")]);
    await userEvent.click(
      screen.getByRole("button", { name: `${adminCopy.moreActions}: Campana` }),
    );
    await userEvent.click(screen.getByRole("menuitem", { name: adminCopy.remove }));
    const dialog = screen.getByRole("dialog", { name: adminCopy.confirmRemoveTitle("Campana") });
    expect(dialog).toBeVisible();
    await userEvent.click(within(dialog).getByRole("button", { name: adminCopy.cancel }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(actions.deleteMedia).not.toHaveBeenCalled();
  });

  it("deletes once the owner confirms", async () => {
    actions.deleteMedia.mockResolvedValue({ ok: true, data: undefined });
    renderManager([item("a", "Campana")]);
    await userEvent.click(
      screen.getByRole("button", { name: `${adminCopy.moreActions}: Campana` }),
    );
    await userEvent.click(screen.getByRole("menuitem", { name: adminCopy.remove }));
    const dialog = screen.getByRole("dialog", { name: adminCopy.confirmRemoveTitle("Campana") });
    await userEvent.click(within(dialog).getByRole("button", { name: adminCopy.remove }));
    expect(actions.deleteMedia).toHaveBeenCalledTimes(1);
    expect(actions.deleteMedia).toHaveBeenCalledWith({ section: "examples", id: "a" });
  });
});
