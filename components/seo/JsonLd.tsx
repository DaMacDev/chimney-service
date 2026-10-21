import { siteConfig } from "@/data/site";
import { siteOrigin } from "@/lib/site-url";

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
        __html: JSON.stringify(data).replace(/</g, "\u003c"),
      }}
    />
  );
}
