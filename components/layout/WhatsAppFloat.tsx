import { useTranslations } from "next-intl";
import { WhatsappIcon } from "@/components/ui/icons";
import { siteConfig } from "@/data/site";

export function WhatsAppFloat() {
  const t = useTranslations("WhatsAppFloat");
  const wa = siteConfig.whatsapps[0];
  // WhatsApp's teal, not its light green: white on #25D366 is ~2:1, under the 3:1 icon minimum.
  return (
    <a
      href={`https://wa.me/${wa.number}?text=${encodeURIComponent(siteConfig.whatsappText)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("label")}
      className="fixed right-5 bottom-5 z-40 inline-flex size-14 items-center justify-center rounded-full bg-[#128C7E] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#075E54] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#075E54]"
    >
      <WhatsappIcon className="size-7" aria-hidden />
    </a>
  );
}
