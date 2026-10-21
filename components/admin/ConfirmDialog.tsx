"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "@vodkadav/ui";
import { adminCopy } from "@/lib/admin/copy";

/**
 * Modal confirmation for destructive actions, on the native <dialog> (focus
 * trap, Esc to cancel, inert page behind). Opens when mounted, so render it
 * only while confirming. Focus starts on Cancel, so a stray Enter never confirms.
 */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  children,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  /** Shown above the text, e.g. thumbnails of what is about to go. */
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onClose={onCancel}
      className="bg-surface text-foreground m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl p-5 shadow-xl backdrop:bg-black/50"
    >
      {children}
      <h2 id={titleId} className="mt-3 font-semibold">
        {title}
      </h2>
      <p id={bodyId} className="text-muted mt-1 text-sm">
        {body}
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" autoFocus onClick={onCancel}>
          {adminCopy.cancel}
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
