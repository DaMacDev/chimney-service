import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Hero } from "@/components/sections/Hero";
import { Stats } from "@/components/sections/Stats";
import { ServicesPreview } from "@/components/sections/ServicesPreview";
import { Features } from "@/components/sections/Features";
import { Sectors } from "@/components/sections/Sectors";
import { Process } from "@/components/sections/Process";
import { GalleryTeaser } from "@/components/sections/GalleryTeaser";
import { Equipment } from "@/components/sections/Equipment";
import { CtaBand } from "@/components/sections/CtaBand";
import { getGallery } from "@/lib/media/gallery";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const gallery = await getGallery(locale);

  return (
    <main>
      <Hero />
      <Stats />
      <ServicesPreview />
      <Features />
      <Sectors />
      <Process />
      <GalleryTeaser items={gallery.carousel} />
      <Equipment />
      <CtaBand />
    </main>
  );
}
