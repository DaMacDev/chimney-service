import Link from "next/link";
import { AppShell, ScrollRegion } from "@vodkadav/ui";
import { ImagePlus } from "lucide-react";
import { SubmitForm } from "@/components/admin/SubmitForm";
import { requireAdmin } from "@/lib/admin/auth";
import { adminCopy } from "@/lib/admin/copy";

/**
 * Scroll contract: AppShell pins the header; the media list is the one bounded
 * vertical ScrollRegion. The document never scrolls.
 */
export default async function AdminPage() {
  const email = await requireAdmin();

  const header = (
    <div className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3">
      <h1 className="font-display text-lg font-bold">{adminCopy.title}</h1>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted hidden sm:inline">
          {adminCopy.signedInAs} <strong className="text-foreground">{email}</strong>
        </span>
        <Link href="/es/gallery" className="text-accent-strong underline underline-offset-4">
          {adminCopy.viewSite}
        </Link>
        <SubmitForm
          action="/admin/auth/logout"
          method="post"
          label={adminCopy.signOut}
          variant="secondary"
        />
      </div>
    </div>
  );

  return (
    <AppShell header={header}>
      <ScrollRegion label={adminCopy.mediaRegion}>
        <div className="text-muted flex flex-col items-center gap-3 px-6 py-16 text-center">
          <ImagePlus className="size-10 opacity-50" aria-hidden />
          <h2 className="text-foreground text-base font-semibold">{adminCopy.emptyTitle}</h2>
          <p className="max-w-md text-sm">{adminCopy.emptyBody}</p>
        </div>
      </ScrollRegion>
    </AppShell>
  );
}
