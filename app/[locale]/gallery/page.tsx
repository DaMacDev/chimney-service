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

  return (
    <main>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <GalleryCarousel />
      </section>
      <CleaningExamples />
      <BeforeAfterVideo />
      <CtaBand />
    </main>
  );
}
