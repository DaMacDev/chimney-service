import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { pageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/sections/PageHeader";
import { GalleryCarousel } from "@/components/features/GalleryCarousel";
import { BeforeAfterVideo } from "@/components/sections/BeforeAfterVideo";
import { CleaningExamples } from "@/components/sections/CleaningExamples";
import { CtaBand } from "@/components/sections/CtaBand";
import { AdminEditLink } from "@/components/features/AdminEditLink";
import { getGallery } from "@/lib/media/gallery";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "galleryTitle", "galleryDesc", "/gallery");
}

export default async function GalleryPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Gallery");
  const gallery = await getGallery(locale);

  return (
    <main>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto mb-4 flex max-w-4xl justify-end empty:hidden">
          <AdminEditLink />
        </div>
        <GalleryCarousel slides={gallery.carousel} />
      </section>
      <CleaningExamples items={gallery.examples} />
      <BeforeAfterVideo pairs={gallery.pairs} />
      <CtaBand />
    </main>
  );
}
