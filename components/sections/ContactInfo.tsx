import { useTranslations } from "next-intl";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { WhatsappIcon } from "@/components/ui/icons";
import { siteConfig } from "@/data/site";

export function ContactInfo() {
  const t = useTranslations("Contact");

  const rows = [
    {
      Icon: Phone,
      title: t("phoneTitle"),
      value: siteConfig.phone,
      href: `tel:${siteConfig.phone.replace(/\s/g, "")}`,
    },
    { Icon: Mail, title: t("emailTitle"), value: siteConfig.email, href: `mailto:${siteConfig.email}` },
    ...siteConfig.whatsapps.map((wa) => ({
      Icon: WhatsappIcon,
      title: t("whatsappTitle"),
      value: wa.display,
      href: `https://wa.me/${wa.number}?text=${encodeURIComponent(siteConfig.whatsappText)}`,
    })),
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-foreground text-xl font-bold">{t("infoTitle")}</h2>
        <ul className="mt-5 space-y-4">
          {rows.map(({ Icon, title, value, href }) => (
            <li key={href}>
              <a
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="group flex items-start gap-4"
              >
                <span className="bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white inline-flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="text-muted block text-sm">{title}</span>
                  <span className="text-foreground group-hover:text-accent font-medium transition-colors">
                    {value}
                  </span>
                </span>
              </a>
            </li>
          ))}
          <li className="flex items-start gap-4">
            <span className="bg-accent/10 text-accent inline-flex size-11 shrink-0 items-center justify-center rounded-xl">
              <MapPin className="size-5" aria-hidden />
            </span>
            <span>
              <span className="text-muted block text-sm">{t("addressTitle")}</span>
              <span className="text-foreground font-medium">
                {siteConfig.address.street} · {siteConfig.address.city}
              </span>
            </span>
          </li>
          <li className="flex items-start gap-4">
            <span className="bg-accent/10 text-accent inline-flex size-11 shrink-0 items-center justify-center rounded-xl">
              <Clock className="size-5" aria-hidden />
            </span>
            <span>
              <span className="text-muted block text-sm">{t("hoursTitle")}</span>
              <span className="text-foreground font-medium">{t("hours")}</span>
            </span>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-muted mb-3 text-sm font-semibold">{t("contactsTitle")}</h3>
        <ul className="grid gap-4 sm:grid-cols-2">
          {siteConfig.contacts.map((c) => (
            <li key={c.email} className="border-border-subtle bg-surface rounded-2xl border p-4">
              <p className="font-display text-foreground font-bold">{c.name}</p>
              <p className="text-muted text-sm">{c.role}</p>
              <a
                href={`mailto:${c.email}`}
                className="text-accent hover:text-accent-strong mt-2 block text-sm break-all transition-colors"
              >
                {c.email}
              </a>
              <a
                href={`tel:${c.phone.replace(/\s/g, "")}`}
                className="text-muted hover:text-accent block text-sm transition-colors"
              >
                {c.phone}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-muted mb-3 text-sm font-semibold">{t("mapTitle")}</h3>
        <div className="border-border-subtle aspect-[16/9] overflow-hidden rounded-2xl border">
          <iframe
            title={t("mapTitle")}
            src={`https://www.google.com/maps?q=${encodeURIComponent(siteConfig.mapsQuery)}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="size-full"
          />
        </div>
      </div>
    </div>
  );
}
