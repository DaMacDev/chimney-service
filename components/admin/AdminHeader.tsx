import Link from "next/link";
import { SubmitForm } from "@/components/admin/SubmitForm";
import { adminCopy } from "@/lib/admin/copy";

/** Pinned admin header: title (or back link), signed-in email, site link, sign out. */
export function AdminHeader({
  email,
  title,
  back,
}: {
  email: string;
  title: string;
  back?: boolean;
}) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-3">
        {back && (
          <Link href="/admin" className="text-accent-strong text-sm underline underline-offset-4">
            ← {adminCopy.back}
          </Link>
        )}
        <h1 className="font-display text-lg font-bold">{title}</h1>
      </div>
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
}
