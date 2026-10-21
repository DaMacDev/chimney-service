"use client";

import { useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ViewMedia } from "@/lib/media/view";
import { cn } from "@/lib/utils";

export function GalleryCarousel({ slides }: { slides: ViewMedia[] }) {
  const t = useTranslations("Gallery");
  const [index, setIndex] = useState(0);
  const count = slides.length;

  if (count === 0) return null;

  const go = (to: number) => setIndex(((to % count) + count) % count);
  const current = slides[index];

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") go(index - 1);
    if (event.key === "ArrowRight") go(index + 1);
  }

  return (
    <div
      className="mx-auto max-w-4xl"
      role="group"
      aria-roledescription="carousel"
      aria-label={t("title")}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div className="border-border-subtle bg-surface relative aspect-[16/10] overflow-hidden rounded-3xl border shadow-[0_30px_80px_-40px_rgba(33,26,21,0.45)]">
        {/* Served straight from R2, not via Vercel's optimizer (Hobby quota). */}
        <Image
          key={current.src}
          src={current.src}
          alt={current.label}
          fill
          unoptimized
          sizes="(max-width: 896px) 100vw, 896px"
          className="object-cover"
          priority
        />

        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label={t("prev")}
          className="text-foreground absolute top-1/2 left-3 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 shadow-md backdrop-blur transition hover:bg-white"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label={t("next")}
          className="text-foreground absolute top-1/2 right-3 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 shadow-md backdrop-blur transition hover:bg-white"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>

      <div aria-live="polite" className="mt-5 text-center">
        {current.name && (
          <p className="font-display text-foreground text-lg font-bold">{current.name}</p>
        )}
        {current.caption && (
          <p className="text-foreground text-lg font-medium">{current.caption}</p>
        )}
        {current.description && (
          <p className="text-muted mx-auto mt-1 max-w-2xl text-sm">{current.description}</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => go(i)}
            aria-label={t("goToImage", { number: i + 1 })}
            aria-current={i === index ? "true" : undefined}
            className={cn(
              "h-2.5 rounded-full transition-all",
              i === index ? "bg-accent w-7" : "bg-foreground/20 hover:bg-foreground/40 w-2.5",
            )}
          />
        ))}
      </div>
    </div>
  );
}
