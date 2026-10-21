import { Heading } from "@/components/ui/heading";
import { GradientText } from "@/components/ui/gradient-text";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

/** Top band for inner pages; padded to clear the fixed navigation. */
export function PageHeader({ eyebrow, title, subtitle }: PageHeaderProps) {
  return (
    <section className="border-border-subtle border-b pt-28 pb-14 sm:pt-32 sm:pb-16">
      <div className="mx-auto max-w-6xl px-6">
        {eyebrow && (
          <p className="text-accent mb-3 text-sm font-semibold tracking-[0.18em] uppercase">
            {eyebrow}
          </p>
        )}
        <Heading as="h1" size="section">
          <GradientText>{title}</GradientText>
        </Heading>
        {subtitle && <p className="text-muted mt-4 max-w-2xl text-lg leading-relaxed">{subtitle}</p>}
      </div>
    </section>
  );
}
