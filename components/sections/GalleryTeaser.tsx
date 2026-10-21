import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SectionHeading } from "@/components/ui/section-heading";
import type { ViewMedia } from "@/lib/media/view";

/** Home-page preview: the first four carousel photos. */
export function GalleryTeaser({ items }: { items: ViewMedia[] }) {
  const t = useTranslations("Gallery");
  const preview = items.slice(0, 4);

  return (
    <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <SectionHeading title={t("teaserTitle")} subtitle={t("teaserSubtitle")} />

      {preview.length > 0 && (
        <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {preview.map((img) => (
            <div
              key={img.id}
              className="border-border-subtle relative aspect-[3/4] overflow-hidden rounded-2xl border"
            >
              <Image
                src={img.src}
                alt={img.label}
                fill
                unoptimized
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 text-center">
        <Link
          href="/gallery"
          className="text-accent hover:text-accent-strong inline-flex items-center gap-2 font-semibold transition-colors"
        >
          {t("cta")}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
