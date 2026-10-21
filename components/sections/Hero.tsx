import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Heading } from "@/components/ui/heading";
import { featureImages } from "@/data/gallery";

export function Hero() {
  const t = useTranslations("Hero");

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src={featureImages.hero}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1f2a]/85 via-[#0b1f2a]/55 to-[#0b1f2a]/20" />
        <div className="from-background absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
      </div>

      <div className="mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center px-6 py-32 text-white">
        <p className="border-accent/40 bg-accent/10 mb-6 inline-flex w-fit items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold tracking-wide text-white backdrop-blur-md">
          <ShieldCheck className="size-3.5" aria-hidden />
          {t("eyebrow")}
        </p>

        <Heading as="h1" size="hero" className="max-w-3xl text-white drop-shadow-sm">
          {t("title")}
        </Heading>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85">{t("subtitle")}</p>

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link
            href="/contact"
            className="bg-accent-strong inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-white shadow-[0_10px_40px_-10px_var(--accent)] transition-all hover:brightness-110"
          >
            {t("ctaPrimary")}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/15"
          >
            {t("ctaSecondary")}
          </Link>
        </div>

        <p className="mt-10 inline-flex w-fit max-w-md rounded-full bg-black/30 px-4 py-2 text-sm text-white/90 backdrop-blur-sm">
          {t("trust")}
        </p>
      </div>
    </section>
  );
}
