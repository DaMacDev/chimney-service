"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

const subscribe = () => () => {};
const hasHint = () => document.cookie.split("; ").includes("na_admin_hint=1");

/**
 * "Edit gallery" link, shown only to a signed-in owner. Reads the non-secret
 * hint cookie so the gallery stays static; /admin itself checks the real session.
 */
export function AdminEditLink() {
  const t = useTranslations("Gallery");
  const visible = useSyncExternalStore(subscribe, hasHint, () => false);

  if (!visible) return null;
  return (
    <Link
      href="/admin"
      className="text-accent-strong inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4"
    >
      <Pencil className="size-4" aria-hidden />
      {t("adminEdit")}
    </Link>
  );
}
