"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, OverflowMenu, ScrollRegion } from "@vodkadav/ui";
import { ArrowDown, ArrowUp, Film, Trash2 } from "lucide-react";
import {
  addMedia,
  deleteMedia,
  moveMedia,
  prepareUpload,
  updateMedia,
  type ActionResult,
} from "@/app/admin/actions";
import { adminCopy } from "@/lib/admin/copy";
import { prepareFile, type PreparedBlob } from "@/lib/admin/prepare-file";
import type { ItemSection, ItemTexts, TextInput } from "@/lib/media/edit";
import { MAX_VIDEO_BYTES } from "@/lib/media/limits";
import type { MediaFile } from "@/lib/media/manifest";

export interface ManagedItem {
  id: string;
  kind: MediaFile["kind"];
  thumb: string;
  name: TextInput;
  caption: TextInput;
  description: TextInput;
}

const FIELDS = ["name", "caption", "description"] as const;
const EMPTY_TEXTS: ItemTexts = { name: {}, caption: {}, description: {} };

const inputClass =
  "border-border-subtle bg-background focus-visible:ring-accent w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none";

/** Name / caption / description in Spanish, plus optional English behind a toggle. */
function TextFields({
  idPrefix,
  value,
  onChange,
}: {
  idPrefix: string;
  value: ItemTexts;
  onChange: (next: ItemTexts) => void;
}) {
  const hasEnglish = FIELDS.some((f) => value[f]?.en);
  const [english, setEnglish] = useState(hasEnglish);
  const set = (field: (typeof FIELDS)[number], lang: "es" | "en", text: string) =>
    onChange({ ...value, [field]: { ...value[field], [lang]: text } });

  const field = (f: (typeof FIELDS)[number], lang: "es" | "en") => {
    const id = `${idPrefix}-${f}-${lang}`;
    const label = `${adminCopy[f]}${lang === "en" ? ` ${adminCopy.englishSuffix}` : ""} (${adminCopy.optional})`;
    const multiline = f === "description";
    return (
      <div key={id} className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {multiline ? (
          <textarea
            id={id}
            rows={3}
            className={inputClass}
            value={value[f]?.[lang] ?? ""}
            onChange={(e) => set(f, lang, e.target.value)}
          />
        ) : (
          <input
            id={id}
            className={inputClass}
            value={value[f]?.[lang] ?? ""}
            onChange={(e) => set(f, lang, e.target.value)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {FIELDS.map((f) => field(f, "es"))}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={english} onChange={(e) => setEnglish(e.target.checked)} />
        {adminCopy.englishToggle}
      </label>
      {english && FIELDS.map((f) => field(f, "en"))}
    </div>
  );
}

/** Runs a Server Action; a thrown error (network, server crash) becomes the Spanish generic message. */
async function call<T>(action: Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  return action.catch(() => ({ ok: false, error: adminCopy.genericError }));
}

/** Uploads one prepared blob through a presigned link; returns its object key. */
async function uploadBlob(blob: PreparedBlob): Promise<string> {
  const ticket = await call(
    prepareUpload({ sha256: blob.sha256, contentType: blob.contentType, bytes: blob.blob.size }),
  );
  if (!ticket.ok) throw new Error(ticket.error);
  if (ticket.data.url) {
    // A network failure throws a raw TypeError; the owner gets the Spanish message.
    const res = await fetch(ticket.data.url, {
      method: "PUT",
      body: blob.blob,
      headers: ticket.data.headers,
    }).catch(() => null);
    if (!res?.ok) throw new Error(adminCopy.uploadFailed);
  }
  return ticket.data.key;
}

function AddForm({
  section,
  accept,
  onDone,
}: {
  section: ItemSection;
  accept: string;
  onDone: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [texts, setTexts] = useState<ItemTexts>(EMPTY_TEXTS);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ tone: "info" | "error" | "ok"; text: string } | null>(
    null,
  );

  async function submit() {
    const file = fileRef.current?.files?.[0];
    if (!file) return setStatus({ tone: "error", text: adminCopy.chooseFile });
    // Before hashing: a multi-GB video would otherwise be read into memory first.
    if (!file.type.startsWith("image/") && file.size > MAX_VIDEO_BYTES) {
      return setStatus({ tone: "error", text: adminCopy.errors.videoTooBig });
    }
    setBusy(true);
    try {
      setStatus({ tone: "info", text: adminCopy.preparing });
      const prepared = await prepareFile(file);
      setStatus({ tone: "info", text: adminCopy.uploading });
      const poster = prepared.poster ? await uploadBlob(prepared.poster) : undefined;
      const key = await uploadBlob(prepared.main);
      setStatus({ tone: "info", text: adminCopy.saving });
      const kind = prepared.poster ? "video" : "image";
      const result = await call(
        addMedia({
          section,
          file: {
            key,
            kind,
            width: prepared.main.width,
            height: prepared.main.height,
            bytes: prepared.main.blob.size,
            ...(poster ? { poster } : {}),
          },
          texts,
        }),
      );
      if (!result.ok) throw new Error(result.error);
      setTexts(EMPTY_TEXTS);
      if (fileRef.current) fileRef.current.value = "";
      setStatus({ tone: "ok", text: adminCopy.uploaded });
      onDone();
    } catch (err) {
      setStatus({
        tone: "error",
        text: err instanceof Error ? err.message : adminCopy.genericError,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby={`add-${section}`}
      className="border-border-subtle bg-surface flex flex-col gap-4 rounded-2xl border p-5"
    >
      <h2 id={`add-${section}`} className="font-semibold">
        {adminCopy.addTitle}
      </h2>
      <div className="flex flex-col gap-1">
        <label htmlFor={`file-${section}`} className="text-sm font-medium">
          {adminCopy.fileLabel}
        </label>
        <input
          id={`file-${section}`}
          ref={fileRef}
          type="file"
          accept={accept}
          className="text-sm"
        />
        <p className="text-muted text-xs">{adminCopy.fileHelp}</p>
      </div>
      <TextFields idPrefix={`new-${section}`} value={texts} onChange={setTexts} />
      {/* Kept mounted so screen readers announce changes to it. */}
      <p role="status" className="text-muted text-sm empty:hidden">
        {status && status.tone !== "error" ? status.text : ""}
      </p>
      {status?.tone === "error" && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {status.text}
        </p>
      )}
      <Button variant="primary" onClick={submit} disabled={busy}>
        {adminCopy.upload}
      </Button>
    </section>
  );
}

function ItemRow({
  section,
  item,
  index,
  last,
  onDone,
}: {
  section: ItemSection;
  item: ManagedItem;
  index: number;
  last: boolean;
  onDone: (announcement?: string) => void;
}) {
  const saved: ItemTexts = {
    name: item.name,
    caption: item.caption,
    description: item.description,
  };
  const [editing, setEditing] = useState(false);
  const [texts, setTexts] = useState<ItemTexts>(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** One action at a time: a double click must not move twice or delete twice. */
  async function run(action: () => Promise<ActionResult>, announcement?: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await call(action());
    setBusy(false);
    if (!result.ok) return setError(result.error);
    onDone(announcement);
  }

  const move = (direction: -1 | 1) =>
    run(
      () => moveMedia({ section, id: item.id, direction }),
      adminCopy.movedTo(index + 1 + direction),
    );

  const title = item.name.es || item.caption.es || adminCopy.untitled;

  return (
    <li className="border-border-subtle bg-surface flex flex-col gap-3 rounded-2xl border p-3">
      <div className="flex items-center gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-black">
          <Image src={item.thumb} alt="" fill unoptimized sizes="80px" className="object-cover" />
          {item.kind === "video" && (
            <span className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded bg-black/70 px-1 text-[10px] text-white">
              <Film className="size-3" aria-hidden /> {adminCopy.video}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{title}</p>
          {item.caption.es && item.name.es && (
            <p className="text-muted truncate text-sm">{item.caption.es}</p>
          )}
        </div>
        {!editing && (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              size="sm"
              aria-label={`${adminCopy.edit}: ${title}`}
              onClick={() => setEditing(true)}
            >
              {adminCopy.edit}
            </Button>
            <OverflowMenu
              label={`${adminCopy.moreActions}: ${title}`}
              actions={[
                {
                  id: "up",
                  label: adminCopy.moveUp,
                  icon: <ArrowUp className="size-4" aria-hidden />,
                  disabled: busy || index === 0,
                  onSelect: () => move(-1),
                },
                {
                  id: "down",
                  label: adminCopy.moveDown,
                  icon: <ArrowDown className="size-4" aria-hidden />,
                  disabled: busy || last,
                  onSelect: () => move(1),
                },
                {
                  id: "remove",
                  label: adminCopy.remove,
                  icon: <Trash2 className="size-4" aria-hidden />,
                  danger: true,
                  disabled: busy,
                  onSelect: () =>
                    window.confirm(adminCopy.confirmRemove)
                      ? run(() => deleteMedia({ section, id: item.id }), adminCopy.removed)
                      : undefined,
                },
              ]}
            />
          </div>
        )}
      </div>
      {editing && (
        <div className="flex flex-col gap-3">
          <TextFields idPrefix={`edit-${item.id}`} value={texts} onChange={setTexts} />
          <div className="flex gap-2">
            <Button
              variant="primary"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  const result = await updateMedia({ section, id: item.id, texts });
                  if (result.ok) setEditing(false);
                  return result;
                }, adminCopy.saved)
              }
            >
              {adminCopy.save}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setTexts(saved);
                setEditing(false);
              }}
            >
              {adminCopy.cancel}
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
    </li>
  );
}

/**
 * One admin section: add form + ordered list. Scroll contract: this is the
 * screen's single bounded vertical ScrollRegion (AppShell pins the header).
 * Ceiling: no paging and full-size thumbnails; fine for tens of items, add
 * paging and resized thumbnails if a section grows into the hundreds.
 */
export function MediaManager({
  section,
  items,
  accept,
  hint,
}: {
  section: ItemSection;
  items: ManagedItem[];
  accept: string;
  hint: string;
}) {
  const router = useRouter();
  const [announcement, setAnnouncement] = useState("");
  const refresh = (message?: string) => {
    setAnnouncement(message ?? "");
    router.refresh();
  };

  return (
    <ScrollRegion label={adminCopy.listRegion}>
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[22rem_1fr] lg:items-start">
        <p role="status" className="sr-only">
          {announcement}
        </p>
        <AddForm section={section} accept={accept} onDone={() => refresh()} />
        <div className="flex min-w-0 flex-col gap-3">
          <p className="text-muted text-sm">{hint}</p>
          {items.length === 0 ? (
            <div className="border-border-subtle text-muted rounded-2xl border border-dashed p-8 text-center">
              <p className="text-foreground font-medium">{adminCopy.emptyTitle}</p>
              <p className="text-sm">{adminCopy.emptyBody}</p>
            </div>
          ) : (
            <ol className="flex flex-col gap-3">
              {items.map((item, i) => (
                <ItemRow
                  key={item.id}
                  section={section}
                  item={item}
                  index={i}
                  last={i === items.length - 1}
                  onDone={refresh}
                />
              ))}
            </ol>
          )}
        </div>
      </div>
    </ScrollRegion>
  );
}
