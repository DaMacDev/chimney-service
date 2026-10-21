import { useTranslations } from "next-intl";
import { Phone, Mail, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Logo } from "./Logo";
import { WhatsappIcon } from "@/components/ui/icons";
import { siteConfig } from "@/data/site";

const NAV_LINKS = [
  { href: "/services", key: "services" },
  { href: "/gallery", key: "gallery" },
  { href: "/before-after", key: "beforeAfter" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export function Footer() {
  const t = useTranslations("Footer");
  const tn = useTranslations("Nav");
  const year = new Date().getFullYear();

  return (
    <footer className="border-border-subtle bg-surface relative mt-24 border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Logo />
          <p className="text-muted mt-4 max-w-xs text-sm leading-relaxed">{t("tagline")}</p>
          <p className="text-muted/80 mt-4 text-xs">{t("serviceArea")}</p>
        </div>

        <nav className="flex flex-col gap-3" aria-label={t("quickLinksTitle")}>
          <p className="text-foreground font-display text-sm font-semibold">{t("quickLinksTitle")}</p>
          {NAV_LINKS.map(({ href, key }) => (
            <Link key={key} href={href} className="text-muted hover:text-accent text-sm transition-colors">
              {tn(key)}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-3">
          <p className="text-foreground font-display text-sm font-semibold">{t("contactTitle")}</p>
          <a
            href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
            className="text-muted hover:text-accent inline-flex items-center gap-2 text-sm transition-colors"
          >
            <Phone className="size-4 shrink-0" aria-hidden />
            {siteConfig.phone}
          </a>
          <a
            href={`mailto:${siteConfig.email}`}
            className="text-muted hover:text-accent inline-flex items-center gap-2 text-sm transition-colors"
          >
            <Mail className="size-4 shrink-0" aria-hidden />
            {siteConfig.email}
          </a>
          <p className="text-muted inline-flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {siteConfig.address.street}
              <br />
              {siteConfig.address.city}
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-foreground font-display text-sm font-semibold">{t("followTitle")}</p>
          {siteConfig.whatsapps.map((wa) => (
            <a
              key={wa.number}
              href={`https://wa.me/${wa.number}?text=${encodeURIComponent(siteConfig.whatsappText)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp ${wa.display}`}
              className="border-border-subtle text-muted hover:text-accent hover:border-accent/50 inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors"
            >
              <WhatsappIcon className="size-4 shrink-0" />
              {wa.display}
            </a>
          ))}
        </div>
      </div>

      <div className="border-border-subtle border-t">
        <div className="text-muted mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs sm:flex-row">
          <p>
            © {year} {siteConfig.name}. {t("rights")}
          </p>
          <p className="text-muted/70">{t("builtNote")}</p>
        </div>
      </div>
    </footer>
  );
}
