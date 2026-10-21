import { useTranslations } from "next-intl";
import { stats } from "@/data/stats";

export function Stats() {
  const t = useTranslations("Stats");

  return (
    <section className="relative z-10 mx-auto -mt-12 max-w-6xl px-6">
      <div className="border-border-subtle bg-surface grid grid-cols-2 gap-px overflow-hidden rounded-3xl border shadow-[0_20px_60px_-30px_rgba(33,26,21,0.35)] lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.key} className="bg-surface flex flex-col items-center gap-1 px-6 py-8 text-center">
            <span className="font-display text-accent text-4xl font-bold sm:text-5xl">
              {stat.value}
            </span>
            <span className="text-muted text-sm">{t(stat.key)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
