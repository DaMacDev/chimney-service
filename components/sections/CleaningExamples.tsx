import Image from "next/image";
import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/ui/section-heading";
import { SpeedVideo, type SpeedOption } from "@/components/features/SpeedVideo";
import { cleaningExamples } from "@/data/gallery";

const PLAYBACK_RATES = [1, 2, 3, 4];

/**
 * "Cleaning examples" on the gallery page: the client's inspection photos and clips
 * in a CSS-columns masonry, so portrait and landscape media keep their own shape.
 */
export function CleaningExamples() {
  const t = useTranslations("CleaningExamples");
  const tv = useTranslations("VideoDemo");

  const speedOptions: SpeedOption[] = PLAYBACK_RATES.map((rate) => ({
    rate,
    label: tv("speedOption", { rate }),
    ariaLabel: tv("speedOptionLabel", { rate }),
  }));

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <SectionHeading title={t("title")} subtitle={t("subtitle")} />

      <div className="mt-12 columns-1 gap-6 sm:columns-2 lg:columns-3">
        {cleaningExamples.map((item) => {
          const caption = t(`items.${item.key}`);
          return (
            <figure
              key={item.key}
              className="border-border-subtle bg-surface mb-6 break-inside-avoid overflow-hidden rounded-3xl border shadow-[0_30px_80px_-40px_rgba(33,26,21,0.45)]"
            >
              {item.kind === "video" ? (
                <SpeedVideo
                  src={item.src}
                  poster={item.poster}
                  caption={caption}
                  speedLabel={tv("speedLabel")}
                  speedOptions={speedOptions}
                  className={item.portrait ? "aspect-[9/16]" : undefined}
                />
              ) : (
                <Image
                  src={item.src}
                  alt={caption}
                  width={item.width}
                  height={item.height}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="h-auto w-full"
                />
              )}
              <figcaption className="text-muted px-5 py-4 text-sm">{caption}</figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
