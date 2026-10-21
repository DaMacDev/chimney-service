import { notFound } from "next/navigation";
import { AppShell } from "@vodkadav/ui";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { MediaManager, type ManagedItem } from "@/components/admin/MediaManager";
import { requireAdmin } from "@/lib/admin/auth";
import { adminCopy, type AdminSectionSlug } from "@/lib/admin/copy";
import { mediaBaseUrl } from "@/lib/media/load";
import { mediaUrl, type MediaFile } from "@/lib/media/manifest";
import { readManifest } from "@/lib/media/store";

const SECTIONS = { carrusel: "carousel", ejemplos: "examples", "antes-despues": "pairs" } as const;

type Props = { params: Promise<{ section: string }> };

const thumb = (file: MediaFile, label?: string) => ({
  src: mediaUrl(mediaBaseUrl, file.poster ?? file.key),
  kind: file.kind,
  ...(label ? { label } : {}),
});

export default async function AdminSectionPage({ params }: Props) {
  const email = await requireAdmin();
  const { section: slug } = await params;
  if (!(slug in SECTIONS)) notFound();
  const section = SECTIONS[slug as AdminSectionSlug];
  const copy = adminCopy.sections[slug as AdminSectionSlug];

  const { manifest } = await readManifest();
  const items: ManagedItem[] =
    section === "pairs"
      ? manifest.pairs.map((pair) => ({
          id: pair.id,
          thumbs: [
            thumb(pair.before.file, adminCopy.before),
            thumb(pair.after.file, adminCopy.after),
          ],
          texts: {
            name: pair.name ?? {},
            beforeCaption: pair.before.caption ?? {},
            afterCaption: pair.after.caption ?? {},
            description: pair.description ?? {},
          },
        }))
      : manifest[section].map((item) => ({
          id: item.id,
          thumbs: [thumb(item.file)],
          texts: {
            name: item.name ?? {},
            caption: item.caption ?? {},
            description: item.description ?? {},
          },
        }));

  return (
    <AppShell header={<AdminHeader email={email} title={copy.title} back />}>
      <MediaManager section={section} items={items} copy={copy} />
    </AppShell>
  );
}
