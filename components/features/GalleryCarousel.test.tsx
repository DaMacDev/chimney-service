import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import type { ViewMedia } from "@/lib/media/view";
import { GalleryCarousel } from "./GalleryCarousel";

const slides: ViewMedia[] = ["First", "Second", "Third", "Last"].map((caption, i) => ({
  id: String(i),
  kind: "image",
  src: `https://media.example/media/${i}.jpg`,
  width: 800,
  height: 600,
  caption,
  label: caption,
}));

function renderCarousel(items = slides) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <GalleryCarousel slides={items} />
    </NextIntlClientProvider>,
  );
}

describe("GalleryCarousel", () => {
  it("shows the first image caption initially", () => {
    renderCarousel();
    expect(screen.getByText("First")).toBeInTheDocument();
  });

  it("advances to the next image", async () => {
    renderCarousel();
    await userEvent.click(screen.getByRole("button", { name: "Next image" }));
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("wraps to the last image when going back from the first", async () => {
    renderCarousel();
    await userEvent.click(screen.getByRole("button", { name: "Previous image" }));
    expect(screen.getByText("Last")).toBeInTheDocument();
  });

  it("jumps to an image via its dot indicator", async () => {
    renderCarousel();
    await userEvent.click(screen.getByRole("button", { name: "Go to image 3" }));
    expect(screen.getByText("Third")).toBeInTheDocument();
  });

  it("shows name and description when present", () => {
    renderCarousel([{ ...slides[0], name: "Kitchen hood", description: "Before cleaning" }]);
    expect(screen.getByText("Kitchen hood")).toBeInTheDocument();
    expect(screen.getByText("Before cleaning")).toBeInTheDocument();
  });

  it("renders nothing when there are no slides", () => {
    const { container } = renderCarousel([]);
    expect(container).toBeEmptyDOMElement();
  });
});
