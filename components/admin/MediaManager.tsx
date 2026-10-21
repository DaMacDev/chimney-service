"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, OverflowMenu, ScrollRegion } from "@vodkadav/ui";
import { ArrowDown, ArrowUp, Film, Trash2 } from "lucide-react";
import {
  addMedia,
  addPair,
  deleteMedia,
  moveMedia,
  prepareUpload,
  updateMedia,
  updatePair,
  type ActionResult,
} from "@/app/admin/actions";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { adminCopy } from "@/lib/admin/copy";
import { prepareFile, type PreparedBlob } from "@/lib/admin/prepare-file";
import type { ItemTexts, PairTexts, Section, TextInput } from "@/lib/media/edit";
import { MAX_VIDEO_BYTES } from "@/lib/media/limits";
import type { MediaFile } from "@/lib/media/manifest";

type TextField = keyof ItemTexts | keyof PairTexts;
type Texts = Partial<Record<TextField, TextInput>>;

export interface ManagedItem {
  id: string;
  /** One thumbnail per file: one for an item, before + after for a pair. */
  thumbs: { src: string; kind: MediaFile["kind"]; label?: string }[];
  texts: Texts;
}

interface FieldDef {
  key: TextField;
  label: string;
  multiline?: boolean;
}

const ITEM_FIELDS: FieldDef[] = [
  { key: "name", label: adminCopy.name },
  { key: "caption", label: adminCopy.caption },
  { key: "description", label: adminCopy.description, multiline: true },
];
const PAIR_FIELDS: FieldDef[] = [
  { key: "name", label: adminCopy.name },
  { key: "beforeCaption", label: adminCopy.beforeCaption },
  { key: "afterCaption", label: adminCopy.afterCaption },
  { key: "description", label: adminCopy.description, multiline: true },
];
const fieldsOf = (section: Section) => (section === "pairs" ? PAIR_FIELDS : ITEM_FIELDS);

/** File inputs per section; every slot is required. */
const SLOTS: Record<Section, { key: string; label: string }[]> = {
  carousel: [{ key: "file", label: adminCopy.fileLabel }],
  examples: [{ key: "file", label: adminCopy.fileLabel }],
  pairs: [
    { key: "before", label: adminCopy.beforeFile },
    { key: "after", label: adminCopy.afterFile },
  ],
};

const inputClass =
  "border-border-subtle bg-background focus-visible:ring-accent w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none";

/** The section's text fields in Spanish, plus optional English behind a toggle. */
function TextFields({
  idPrefix,
  fields,
  value,
  onChange,
}: {
  idPrefix: string;
  fields: FieldDef[];
  value: Texts;
  onChange: (next: Texts) => void;
}) {
  const [english, setEnglish] = useState(fields.some((f) => value[f.key]?.en));
  const set = (key: TextField, lang: "es" | "en", text: string) =>
    onChange({ ...value, [key]: { ...value[key], [lang]: text } });

  const field = (f: FieldDef, lang: "es" | "en") => {
    const id = `${idPrefix}-${f.key}-${lang}`;
    const label = `${f.label}${lang === "en" ? ` ${adminCopy.englishSuffix}` : ""} (${adminCopy.optional})`;
    const props = {
      id,
      className: inputClass,
      value: value[f.key]?.[lang] ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        set(f.key, lang, e.target.value),
    };
    return (
      <div key={id} className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {f.multiline ? <textarea rows={3} {...props} /> : <input {...props} />}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {fields.map((f) => field(f, "es"))}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={english} onChange={(e) => setEnglish(e.target.checked)} />
        {adminCopy.englishToggle}
      </label>
      {english && fields.map((f) => field(f, "en"))}
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

/** Prepares and uploads one chosen file (plus a video's poster); throws a Spanish message. */
async function uploadFile(file: File): Promise<MediaFile> {
  const prepared = await prepareFile(file);
  const poster = prepared.poster ? await uploadBlob(prepared.poster) : undefined;
  const key = await uploadBlob(prepared.main);
  return {
    key,
    kind: prepared.poster ? "video" : "image",
    width: prepared.main.width,
    height: prepared.main.height,
    bytes: prepared.main.blob.size,
    ...(poster ? { poster } : {}),
  };
}

function AddForm({
  section,
  accept,
  title,
  onDone,
}: {
  section: Section;
  accept: string;
  title: string;
  onDone: () => void;
}) {
  const slots = SLOTS[section];
  const [chosen, setChosen] = useState<Record<string, File | undefined>>({});
  // Bumped after a successful upload to remount (clear) the file inputs.
  const [inputsKey, setInputsKey] = useState(0);
  const [texts, setTexts] = useState<Texts>({});
  const [status, setStatus] = useState<{ tone: "info" | "error" | "ok"; text: string } | null>(
    null,
  );

  /** Button single-flights this (it returns a promise), so a double click adds once. */
  async function submit() {
    const files = slots.map((slot) => chosen[slot.key]);
    if (files.some((f) => !f)) {
      const text = slots.length > 1 ? adminCopy.chooseBothFiles : adminCopy.chooseFile;
      return setStatus({ tone: "error", text });
    }
    // Before hashing: a multi-GB video would otherwise be read into memory first.
    if (files.some((f) => !f!.type.startsWith("image/") && f!.size > MAX_VIDEO_BYTES)) {
      return setStatus({ tone: "error", text: adminCopy.errors.videoTooBig });
    }
    try {
      const uploaded: MediaFile[] = [];
      for (const file of files) {
        setStatus({ tone: "info", text: adminCopy.uploading });
        uploaded.push(await uploadFile(file!));
      }
      setStatus({ tone: "info", text: adminCopy.saving });
      const result = await call(
        section === "pairs"
          ? addPair({ before: uploaded[0], after: uploaded[1], texts })
          : addMedia({ section, file: uploaded[0], texts }),
      );
      if (!result.ok) throw new Error(result.error);
      setTexts({});
      setChosen({});
      setInputsKey((k) => k + 1);
      setStatus({ tone: "ok", text: adminCopy.uploaded });
      onDone();
    } catch (err) {
      setStatus({
        tone: "error",
        text: err instanceof Error ? err.message : adminCopy.genericError,
      });
    }
  }

  return (
    <section
      aria-labelledby={`add-${section}`}
      className="border-border-subtle bg-surface flex flex-col gap-4 rounded-2xl border p-5"
    >
      <h2 id={`add-${section}`} className="font-semibold">
        {title}
      </h2>
      {slots.map((slot) => (
        <div key={`${slot.key}-${inputsKey}`} className="flex flex-col gap-1">
          <label htmlFor={`file-${section}-${slot.key}`} className="text-sm font-medium">
            {slot.label}
          </label>
          <input
            id={`file-${section}-${slot.key}`}
            onChange={(e) => {
              const file = e.target.files?.[0];
              setChosen((prev) => ({ ...prev, [slot.key]: file }));
            }}
            type="file"
            accept={accept}
            className="text-sm"
          />
        </div>
      ))}
      <p className="text-muted -mt-2 text-xs">{adminCopy.fileHelp}</p>
      <TextFields
        idPrefix={`new-${section}`}
        fields={fieldsOf(section)}
        value={texts}
        onChange={setTexts}
      />
      {/* Kept mounted so screen readers announce changes to it. */}
      <p role="status" className="text-muted text-sm empty:hidden">
        {status && status.tone !== "error" ? status.text : ""}
      </p>
      {status?.tone === "error" && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {status.text}
        </p>
      )}
      <Button variant="primary" onClick={submit}>
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
  section: Section;
  item: ManagedItem;
  index: number;
  last: boolean;
  onDone: (announcement?: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [texts, setTexts] = useState<Texts>(item.texts);
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** One action at a time: a double click must not move twice or delete twice. */
  async function run(action: () => Promise<ActionResult>, announcement?: string) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    const result = await call(action());
    inFlight.current = false;
    setBusy(false);
    if (!result.ok) return setError(result.error);
    onDone(announcement);
  }

  const move = (direction: -1 | 1) =>
    run(
      () => moveMedia({ section, id: item.id, direction }),
      adminCopy.movedTo(index + 1 + direction),
    );

  const save = () =>
    run(async () => {
      const result = await (section === "pairs"
        ? updatePair({ id: item.id, texts })
        : updateMedia({ section, id: item.id, texts }));
      if (result.ok) setEditing(false);
      return result;
    }, adminCopy.saved);

  const t = item.texts;
  const caption = t.caption?.es || t.beforeCaption?.es || t.afterCaption?.es;
  // The position keeps unnamed rows' button names unique for screen readers.
  const title = t.name?.es || caption || adminCopy.untitled(index + 1);

  const thumbs = (
    <div className="flex shrink-0 gap-1">
      {item.thumbs.map((thumb, i) => (
        <div key={i} className="relative size-20 overflow-hidden rounded-lg bg-black">
          <Image src={thumb.src} alt="" fill unoptimized sizes="80px" className="object-cover" />
          {(thumb.label || thumb.kind === "video") && (
            <span className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded bg-black/70 px-1 text-[10px] text-white">
              {thumb.kind === "video" && <Film className="size-3" aria-hidden />}
              {thumb.label ?? adminCopy.video}
            </span>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <li className="border-border-subtle bg-surface flex flex-col gap-3 rounded-2xl border p-3">
      <div className="flex items-center gap-3">
        {thumbs}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{title}</p>
          {caption && t.name?.es && <p className="text-muted truncate text-sm">{caption}</p>}
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
                  onSelect: () => setConfirmingRemove(true),
                },
              ]}
            />
          </div>
        )}
      </div>
      {editing && (
        <div className="flex flex-col gap-3">
          <TextFields
            idPrefix={`edit-${item.id}`}
            fields={fieldsOf(section)}
            value={texts}
            onChange={setTexts}
          />
          <div className="flex gap-2">
            <Button variant="primary" disabled={busy} onClick={save}>
              {adminCopy.save}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setTexts(item.texts);
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
      {confirmingRemove && (
        <ConfirmDialog
          title={adminCopy.confirmRemoveTitle(title)}
          body={adminCopy.confirmRemove}
          confirmLabel={adminCopy.remove}
          onCancel={() => setConfirmingRemove(false)}
          onConfirm={() => {
            setConfirmingRemove(false);
            void run(() => deleteMedia({ section, id: item.id }), adminCopy.removed);
          }}
        >
          {thumbs}
        </ConfirmDialog>
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
  copy,
}: {
  section: Section;
  items: ManagedItem[];
  copy: { accept: string; hint: string; addTitle: string; emptyBody: string };
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
        <AddForm
          section={section}
          accept={copy.accept}
          title={copy.addTitle}
          onDone={() => refresh()}
        />
        <div className="flex min-w-0 flex-col gap-3">
          <p className="text-muted text-sm">{copy.hint}</p>
          {items.length === 0 ? (
            <div className="border-border-subtle text-muted rounded-2xl border border-dashed p-8 text-center">
              <p className="text-foreground font-medium">{adminCopy.emptyTitle}</p>
              <p className="text-sm">{copy.emptyBody}</p>
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
