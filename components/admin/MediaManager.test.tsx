import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { adminCopy } from "@/lib/admin/copy";
import { MediaManager, type ManagedItem } from "./MediaManager";

const actions = vi.hoisted(() => ({
  prepareUpload: vi.fn(),
  addMedia: vi.fn(),
  updateMedia: vi.fn(),
  moveMedia: vi.fn(),
  deleteMedia: vi.fn(),
}));
vi.mock("@/app/admin/actions", () => actions);
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
const prepareFile = vi.hoisted(() => vi.fn());
vi.mock("@/lib/admin/prepare-file", () => ({ prepareFile }));

const item = (id: string, name: string): ManagedItem => ({
  id,
  kind: "image",
  thumb: `https://media.test/media/${id}.jpg`,
  name: { es: name },
  caption: {},
  description: {},
});

const renderManager = (items: ManagedItem[]) =>
  render(<MediaManager section="examples" items={items} accept="image/*" hint="Pista" />);

async function chooseFile() {
  const photo = new File(["x"], "foto.jpg", { type: "image/jpeg" });
  await userEvent.upload(screen.getByLabelText(adminCopy.fileLabel), photo);
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
});
