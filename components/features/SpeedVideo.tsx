"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface SpeedOption {
  rate: number;
  label: string;
  ariaLabel: string;
}

interface SpeedVideoProps {
  src: string;
  poster?: string;
  caption: string;
  speedLabel: string;
  speedOptions: SpeedOption[];
  /** Extra classes for the `<video>`, e.g. `aspect-[9/16]` for portrait footage. */
  className?: string;
}

/**
 * Self-hosted clip with playback-speed buttons. The before/after footage is already
 * encoded at 3x real time, so these multiply that again — see
 * `docs/reference-existing-site.md`.
 */
export function SpeedVideo({
  src,
  poster,
  caption,
  speedLabel,
  speedOptions,
  className,
}: SpeedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [rate, setRate] = useState(1);

  function applyRate(next: number) {
    setRate(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  }

  return (
    <>
      <video
        ref={videoRef}
        controls
        muted
        playsInline
        preload="metadata"
        poster={poster}
        aria-label={caption}
        // A fresh source resets playbackRate, so re-apply once metadata lands.
        onLoadedMetadata={() => {
          if (videoRef.current) videoRef.current.playbackRate = rate;
        }}
        // The browser's own speed menu changes the rate behind our back; follow it
        // so the buttons never show a rate the video isn't actually playing at.
        onRateChange={() => {
          if (videoRef.current) setRate(videoRef.current.playbackRate);
        }}
        className={cn("aspect-video w-full bg-black object-cover", className)}
      >
        <source src={src} type="video/mp4" />
      </video>

      <div
        role="group"
        aria-label={speedLabel}
        className="flex flex-wrap items-center gap-2 px-5 pt-4"
      >
        <span className="text-muted text-xs font-semibold tracking-[0.12em] uppercase">
          {speedLabel}
        </span>
        {speedOptions.map((option) => (
          <button
            key={option.rate}
            type="button"
            aria-label={option.ariaLabel}
            aria-pressed={rate === option.rate}
            onClick={() => applyRate(option.rate)}
            className={cn(
              "focus-visible:ring-accent focus-visible:ring-offset-background h-11 min-w-11 rounded-full px-3 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              rate === option.rate
                ? "bg-accent-strong text-white shadow-[0_0_24px_-6px_var(--accent)]"
                : "border-border-subtle text-foreground border hover:bg-foreground/[0.04]",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </>
  );
}
