import Image from "next/image";
import { useTranslations } from "next-intl";
import { SpeedVideo, type SpeedOption } from "@/components/features/SpeedVideo";
import type { ViewMedia } from "@/lib/media/view";
import { cn } from "@/lib/utils";

const PLAYBACK_RATES = [1, 2, 3, 4];

/**
 * One gallery photo or clip with its name, caption and description.
 * `shape="natural"` keeps the file's own aspect ratio (masonry); `"video"` crops
 * to 16:9 so before/after halves line up.
 */
export function MediaFigure({
  media,
  shape = "natural",
  badge,
  className,
}: {
  media: ViewMedia;
  shape?: "natural" | "video";
  badge?: { label: string; className: string };
  className?: string;
}) {
  const t = useTranslations("VideoDemo");
  const speedOptions: SpeedOption[] = PLAYBACK_RATES.map((rate) => ({
    rate,
    label: t("speedOption", { rate }),
    ariaLabel: t("speedOptionLabel", { rate }),
  }));
  const ratio = shape === "video" ? 16 / 9 : media.width / media.height;
  const hasText = media.name || media.caption || media.description;

  return (
    <figure
      className={cn(
        "border-border-subtle bg-surface relative overflow-hidden rounded-3xl border shadow-[0_30px_80px_-40px_rgba(33,26,21,0.45)]",
        className,
      )}
    >
      {badge && (
        <span
          className={`absolute top-4 left-4 z-10 rounded-full px-3 py-1 text-xs font-semibold tracking-[0.12em] text-white uppercase shadow-md ${badge.className}`}
        >
          {badge.label}
        </span>
      )}
      {media.kind === "video" ? (
        <SpeedVideo
          src={media.src}
          poster={media.poster}
          caption={media.label}
          speedLabel={t("speedLabel")}
          speedOptions={speedOptions}
          aspectRatio={ratio}
        />
      ) : (
        // Served straight from R2, not via Vercel's optimizer (Hobby quota).
        <Image
          src={media.src}
          alt={media.label}
          width={media.width}
          height={media.height}
          unoptimized
          style={{ aspectRatio: ratio }}
          className="h-auto w-full object-cover"
        />
      )}
      {hasText && (
        <figcaption className="px-5 py-4 text-sm">
          {media.name && <p className="text-foreground font-semibold">{media.name}</p>}
          {media.caption && <p className="text-muted">{media.caption}</p>}
          {media.description && <p className="text-muted mt-1 text-xs">{media.description}</p>}
        </figcaption>
      )}
    </figure>
  );
}
