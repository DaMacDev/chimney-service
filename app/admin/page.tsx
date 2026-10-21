import Link from "next/link";
import { AppShell, ScrollRegion } from "@vodkadav/ui";
import { ChevronRight } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { requireAdmin } from "@/lib/admin/auth";
import { adminCopy, type AdminSectionSlug } from "@/lib/admin/copy";
import { MAX_UPLOADS_PER_DAY, STORAGE_BUDGET_BYTES, GB, MB } from "@/lib/media/limits";
import { bucketUsage, readManifest } from "@/lib/media/store";

const SECTION_DATA = { carrusel: "carousel", ejemplos: "examples" } as const;

function Meter({
  label,
  value,
  max,
  text,
}: {
  label: string;
  value: number;
  max: number;
  text: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted">{text}</span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={text}
        className="bg-foreground/10 mt-1 h-2 overflow-hidden rounded-full"
      >
        <div
          className={pct >= 90 ? "h-full bg-red-600" : "bg-accent h-full"}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Scroll contract: AppShell pins the header; the overview is the one bounded
 * vertical ScrollRegion. The document never scrolls. Each section is its own route.
 */
export default async function AdminPage() {
  const email = await requireAdmin();
  const [{ manifest }, usage] = await Promise.all([readManifest(), bucketUsage()]);
  const used =
    usage.totalBytes >= GB
      ? `${(usage.totalBytes / GB).toFixed(2)} GB`
      : `${Math.ceil(usage.totalBytes / MB)} MB`;

  return (
    <AppShell header={<AdminHeader email={email} title={adminCopy.title} />}>
      <ScrollRegion label={adminCopy.overviewRegion}>
        <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
          <section className="border-border-subtle bg-surface flex flex-col gap-4 rounded-2xl border p-5">
            <Meter
              label={adminCopy.storageUsed}
              value={usage.totalBytes}
              max={STORAGE_BUDGET_BYTES}
              text={`${used} de 5 GB`}
            />
            <Meter
              label={adminCopy.uploadsToday}
              value={usage.uploadsToday}
              max={MAX_UPLOADS_PER_DAY}
              text={`${usage.uploadsToday} de ${MAX_UPLOADS_PER_DAY}`}
            />
            <p className="text-muted text-xs">{adminCopy.usageNote}</p>
          </section>

          <nav className="flex flex-col gap-3">
            {(Object.keys(SECTION_DATA) as AdminSectionSlug[]).map((slug) => (
              <Link
                key={slug}
                href={`/admin/${slug}`}
                className="border-border-subtle bg-surface hover:border-accent flex items-center justify-between rounded-2xl border p-5 transition-colors"
              >
                <span>
                  <span className="block font-semibold">{adminCopy.sections[slug].title}</span>
                  <span className="text-muted block text-sm">
                    {adminCopy.itemCount(manifest[SECTION_DATA[slug]].length)} ·{" "}
                    {adminCopy.sections[slug].hint}
                  </span>
                </span>
                <ChevronRight className="text-muted size-5 shrink-0" aria-hidden />
              </Link>
            ))}
          </nav>
        </div>
      </ScrollRegion>
    </AppShell>
  );
}
