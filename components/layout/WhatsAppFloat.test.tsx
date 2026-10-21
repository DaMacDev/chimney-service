import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { WhatsAppFloat } from "./WhatsAppFloat";

describe("WhatsAppFloat", () => {
  it("links to WhatsApp in a new tab with an accessible name", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <WhatsAppFloat />
      </NextIntlClientProvider>,
    );
    const link = screen.getByRole("link", { name: "Chat with us on WhatsApp" });
    expect(link.getAttribute("href")).toContain("wa.me/529981540967");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});
