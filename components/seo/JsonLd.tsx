import { siteConfig } from "@/data/site";
import { siteOrigin } from "@/lib/site-url";

/** JSON for an inline script: `<` escaped so no value can close the tag. */
export function scriptJson(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// No street/postal address or social profiles exist yet: address carries only
// the country, sameAs is omitted. Add them when the client supplies real ones.
export function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: siteOrigin,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    address: { "@type": "PostalAddress", addressCountry: "MX" },
    areaServed: ["Cancún", "Mérida"],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: scriptJson(data),
      }}
    />
  );
}
