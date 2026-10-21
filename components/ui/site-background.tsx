"use client";

import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * Site-wide ambient background: soft warm ember and Caribbean-teal glows on the
 * ivory base, plus a faint grid. Fixed behind all content; honours
 * prefers-reduced-motion (static glows).
 */
export function SiteBackground() {
  const reduced = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ffffff_0%,transparent_60%)]" />
      <div
        className={cn(
          "bg-accent/10 absolute -top-[12%] -left-[8%] size-[48vw] rounded-full blur-[130px]",
          !reduced && "animate-aurora",
        )}
      />
      <div
        className={cn(
          "bg-accent-2/10 absolute top-[34%] -right-[10%] size-[44vw] rounded-full blur-[130px]",
          !reduced && "animate-aurora [animation-delay:-13s]",
        )}
      />
      <div
        className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,#211a15_1px,transparent_1px),linear-gradient(to_bottom,#211a15_1px,transparent_1px)] [background-size:64px_64px]"
      />
    </div>
  );
}
