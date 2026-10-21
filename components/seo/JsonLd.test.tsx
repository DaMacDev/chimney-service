import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { siteConfig } from "@/data/site";
import { JsonLd } from "./JsonLd";

function read() {
  render(<JsonLd />);
  // eslint-disable-next-line testing-library/no-node-access -- script tags have no ARIA role
  const el = document.querySelector('script[type="application/ld+json"]');
  expect(el).not.toBeNull();
  return { raw: el!.innerHTML, data: JSON.parse(el!.innerHTML) };
}

describe("JsonLd", () => {
  it("emits LocalBusiness with real site data", () => {
    const { data } = read();
    expect(data["@type"]).toBe("LocalBusiness");
    expect(data.name).toBe(siteConfig.name);
    expect(data.telephone).toBe(siteConfig.phone);
    expect(data.areaServed).toEqual(["Cancún", "Mérida"]);
  });

  it("omits sameAs", () => {
    expect(read().data).not.toHaveProperty("sameAs");
  });

  it("never emits a raw < in the script body", () => {
    expect(read().raw).not.toContain("<");
  });
});
