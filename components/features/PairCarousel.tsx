"use client";

import { useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MediaFigure } from "@/components/features/MediaFigure";
import type { ViewPair } from "@/components/sections/BeforeAfterVideo";
import { cn } from "@/lib/utils";

const navButton =
  "text-foreground inline-flex size-11 items-center justify-center rounded-full bg-white/85 shadow-md backdrop-blur transition hover:bg-white";

/** One before/after pair at a time; the keyed pair remounts so a playing clip stops on switch. */
export function PairCarousel({ pairs }: { pairs: ViewPair[] }) {
  const t = useTranslations("VideoDemo");
  const [index, setIndex] = useState(0);
  const count = pairs.length;

  if (count === 0) return null;

  const go = (to: number) => setIndex(((to % count) + count) % count);
  // Clamped: the list can shrink when the owner deletes a pair.
  const current = Math.min(index, count - 1);
  const pair = pairs[current];
  const multiple = count > 1;

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Only the carousel itself: arrows on a video or button keep their own meaning.
    if (!multiple || event.target !== event.currentTarget) return;
    if (event.key === "ArrowLeft") go(current - 1);
    if (event.key === "ArrowRight") go(current + 1);
  }

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={t("title")}
      tabIndex={multiple ? 0 : undefined}
      onKeyDown={onKeyDown}
    >
      <div aria-live="polite">
        {(pair.name || pair.description) && (
          <div className="mx-auto mt-4 max-w-2xl text-center text-sm">
            {pair.name && <p className="text-foreground font-semibold">{pair.name}</p>}
            {pair.description && <p className="text-muted">{pair.description}</p>}
          </div>
        )}
      </div>

      <div key={pair.id} className="mt-12 grid gap-6 md:grid-cols-2">
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

      {multiple && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => go(current - 1)}
            aria-label={t("prevPair")}
            className={cn(navButton, "border-border-subtle border")}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <div className="flex flex-wrap justify-center gap-2">
            {pairs.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => go(i)}
                aria-label={t("goToPair", { number: i + 1 })}
                aria-current={i === current ? "true" : undefined}
                className={cn(
                  "h-2.5 rounded-full transition-all",
                  i === current ? "bg-accent w-7" : "bg-foreground/20 hover:bg-foreground/40 w-2.5",
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(current + 1)}
            aria-label={t("nextPair")}
            className={cn(navButton, "border-border-subtle border")}
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
