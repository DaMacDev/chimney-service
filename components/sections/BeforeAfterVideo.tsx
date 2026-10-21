import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/ui/section-heading";
import { PairCarousel } from "@/components/features/PairCarousel";
import type { ViewMedia } from "@/lib/media/view";

export interface ViewPair {
  id: string;
  before: ViewMedia;
  after: ViewMedia;
  name?: string;
  description?: string;
}

/**
 * "Before / After" on the gallery page: owner-managed pairs, one at a time, each
 * half a photo or a clip, cropped to 16:9 so the halves line up.
 */
export function BeforeAfterVideo({ pairs }: { pairs: ViewPair[] }) {
  const t = useTranslations("VideoDemo");
  if (pairs.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <SectionHeading title={t("title")} subtitle={t("subtitle")} />
      <PairCarousel pairs={pairs} />
    </section>
  );
}
