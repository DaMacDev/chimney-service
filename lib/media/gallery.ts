import { getTranslations } from "next-intl/server";
import { loadManifest, mediaBaseUrl } from "./load";
import { viewGallery } from "./view";
import type { Locale } from "@/i18n/routing";

/** Loads the manifest and resolves it for a page in `locale`. */
export async function getGallery(locale: Locale) {
  const [manifest, t, tv] = await Promise.all([
    loadManifest(),
    getTranslations({ locale, namespace: "Gallery" }),
    getTranslations({ locale, namespace: "VideoDemo" }),
  ]);
  return viewGallery(manifest, mediaBaseUrl, locale, {
    item: (number) => t("mediaFallback", { number }),
    before: tv("before"),
    after: tv("after"),
  });
}
