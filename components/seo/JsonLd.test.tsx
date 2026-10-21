import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { siteConfig } from "@/data/site";
import { JsonLd, scriptJson } from "./JsonLd";

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

  it("escapes a value that tries to close the script tag, and still parses back", () => {
    const evil = { name: "</script><script>alert(1)</script>" };
    const out = scriptJson(evil);
    expect(out).not.toContain("<");
    expect(JSON.parse(out)).toEqual(evil);
  });
});
