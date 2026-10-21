import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const headingVariants = cva("font-display font-bold tracking-tight text-balance", {
  variants: {
    size: {
      hero: "text-4xl sm:text-6xl lg:text-7xl",
      section: "text-3xl sm:text-4xl lg:text-5xl",
      card: "text-xl sm:text-2xl",
    },
  },
  defaultVariants: { size: "section" },
});

type HeadingElement = "h1" | "h2" | "h3" | "h4";

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: HeadingElement;
}

export function Heading({ as = "h2", size, className, ...props }: HeadingProps) {
  const Tag = as;
  return <Tag className={cn(headingVariants({ size }), className)} {...props} />;
}
