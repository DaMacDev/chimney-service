import { redirect } from "next/navigation";
import { AppShell } from "@vodkadav/ui";
import { SubmitForm } from "@/components/admin/SubmitForm";
import { getAdminEmail } from "@/lib/admin/auth";
import { adminCopy } from "@/lib/admin/copy";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function AdminLoginPage({ searchParams }: Props) {
  if (await getAdminEmail()) redirect("/admin");
  const { error } = await searchParams;
  const message =
    error === "denied" ? adminCopy.errorDenied : error === "failed" ? adminCopy.errorFailed : null;

  return (
    <AppShell>
      <div className="flex h-full items-center justify-center px-4">
        <div className="border-border-subtle bg-surface w-full max-w-sm rounded-3xl border p-8 text-center shadow-lg">
          <h1 className="font-display text-2xl font-bold">{adminCopy.title}</h1>
          <p className="text-muted mt-3 text-sm">{adminCopy.signInIntro}</p>
          {message && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
              {message}
            </p>
          )}
          {/* A plain GET form: the route redirects to Google, so this works without JS. */}
          <div className="mt-6">
            <SubmitForm action="/admin/auth/login" method="get" label={adminCopy.signIn} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
