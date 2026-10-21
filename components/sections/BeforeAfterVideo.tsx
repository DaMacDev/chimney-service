import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/ui/section-heading";
import { MediaFigure } from "@/components/features/MediaFigure";
import type { ViewMedia } from "@/lib/media/view";

export interface ViewPair {
  id: string;
  before: ViewMedia;
  after: ViewMedia;
  name?: string;
  description?: string;
}

/**
 * "Before / After" on the gallery page: one owner-managed pair, each half a photo
 * or a clip, cropped to 16:9 so the halves line up. (One pair at a time with
 * navigation lands in #8.)
 */
export function BeforeAfterVideo({ pair }: { pair: ViewPair | undefined }) {
  const t = useTranslations("VideoDemo");
  if (!pair) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <SectionHeading title={t("title")} subtitle={t("subtitle")} />

      {(pair.name || pair.description) && (
        <div className="mx-auto mt-4 max-w-2xl text-center text-sm">
          {pair.name && <p className="text-foreground font-semibold">{pair.name}</p>}
          {pair.description && <p className="text-muted">{pair.description}</p>}
        </div>
      )}

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <MediaFigure
          media={pair.before}
          shape="video"
          badge={{ label: t("before"), className: "bg-accent" }}
        />
        <MediaFigure
          media={pair.after}
          shape="video"
          badge={{ label: t("after"), className: "bg-foreground/70" }}
        />
      </div>
    </section>
  );
}
