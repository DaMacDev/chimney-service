import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/ui/section-heading";
import { MediaFigure } from "@/components/features/MediaFigure";
import type { ViewMedia } from "@/lib/media/view";

/**
 * "Cleaning examples" on the gallery page: owner-managed photos and clips in a
 * CSS-columns masonry, so portrait and landscape media keep their own shape.
 */
export function CleaningExamples({ items }: { items: ViewMedia[] }) {
  const t = useTranslations("CleaningExamples");
  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <SectionHeading title={t("title")} subtitle={t("subtitle")} />

      <div className="mt-12 columns-1 gap-6 sm:columns-2 lg:columns-3">
        {items.map((item) => (
          <MediaFigure key={item.id} media={item} className="mb-6 break-inside-avoid" />
        ))}
      </div>
    </section>
  );
}
