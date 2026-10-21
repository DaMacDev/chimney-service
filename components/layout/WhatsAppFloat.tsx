import { useTranslations } from "next-intl";
import { WhatsappIcon } from "@/components/ui/icons";
import { siteConfig } from "@/data/site";

export function WhatsAppFloat() {
  const t = useTranslations("WhatsAppFloat");
  const wa = siteConfig.whatsapps[0];
  return (
    <a
      href={`https://wa.me/${wa.number}?text=${encodeURIComponent(siteConfig.whatsappText)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("label")}
      className="fixed right-5 bottom-5 z-40 inline-flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#128C7E]"
    >
      <WhatsappIcon className="size-7" aria-hidden />
    </a>
  );
}
