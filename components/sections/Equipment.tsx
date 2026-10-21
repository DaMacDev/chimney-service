import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/ui/section-heading";
import { equipment } from "@/data/equipment";

export function Equipment() {
  const t = useTranslations("Equipment");

  return (
    <section className="bg-surface border-border-subtle border-y">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <SectionHeading title={t("title")} subtitle={t("subtitle")} />
        <p className="text-muted mx-auto mt-4 max-w-2xl text-center leading-relaxed">
          {t("intro")}
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {equipment.map(({ key, Icon }) => (
            <div key={key} className="flex items-start gap-4">
              <span className="from-accent to-accent-strong inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-[0_10px_24px_-12px_var(--accent)]">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-display text-foreground font-bold">{t(`items.${key}.title`)}</h3>
                <p className="text-muted mt-1 text-sm leading-relaxed">
                  {t(`items.${key}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
