import { notFound } from "next/navigation";
import { AppShell } from "@vodkadav/ui";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { MediaManager, type ManagedItem } from "@/components/admin/MediaManager";
import { requireAdmin } from "@/lib/admin/auth";
import { adminCopy, type AdminSectionSlug } from "@/lib/admin/copy";
import { mediaBaseUrl } from "@/lib/media/load";
import { mediaUrl } from "@/lib/media/manifest";
import { readManifest } from "@/lib/media/store";

const SECTIONS = { carrusel: "carousel", ejemplos: "examples" } as const;

type Props = { params: Promise<{ section: string }> };

export default async function AdminSectionPage({ params }: Props) {
  const email = await requireAdmin();
  const { section: slug } = await params;
  if (!(slug in SECTIONS)) notFound();
  const section = SECTIONS[slug as AdminSectionSlug];
  const copy = adminCopy.sections[slug as AdminSectionSlug];

  const { manifest } = await readManifest();
  const items: ManagedItem[] = manifest[section].map((item) => ({
    id: item.id,
    kind: item.file.kind,
    thumb: mediaUrl(mediaBaseUrl, item.file.poster ?? item.file.key),
    name: item.name ?? {},
    caption: item.caption ?? {},
    description: item.description ?? {},
  }));

  return (
    <AppShell header={<AdminHeader email={email} title={copy.title} back />}>
      <MediaManager section={section} items={items} accept={copy.accept} hint={copy.hint} />
    </AppShell>
  );
}
