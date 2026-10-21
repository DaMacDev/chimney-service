import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import type { ViewMedia } from "@/lib/media/view";
import type { ViewPair } from "@/components/sections/BeforeAfterVideo";
import { PairCarousel } from "./PairCarousel";

const img = (id: string): ViewMedia => ({
  id,
  kind: "image",
  src: `https://media.example/media/${id}.jpg`,
  width: 800,
  height: 450,
  label: id,
});

const pairs: ViewPair[] = ["First", "Second", "Third", "Last"].map((name, i) => ({
  id: String(i),
  before: img(`b${i}`),
  after: img(`a${i}`),
  name,
}));

function renderCarousel(items = pairs) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PairCarousel pairs={items} />
    </NextIntlClientProvider>,
  );
}

describe("PairCarousel", () => {
  it("shows the first pair initially", () => {
    renderCarousel();
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.queryByText("Second")).not.toBeInTheDocument();
  });

  it("advances to the next pair", async () => {
    renderCarousel();
    await userEvent.click(screen.getByRole("button", { name: "Next pair" }));
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("wraps to the last pair when going back from the first", async () => {
    renderCarousel();
    await userEvent.click(screen.getByRole("button", { name: "Previous pair" }));
    expect(screen.getByText("Last")).toBeInTheDocument();
  });

  it("jumps to a pair via its dot indicator", async () => {
    renderCarousel();
    await userEvent.click(screen.getByRole("button", { name: "Go to pair 3" }));
    expect(screen.getByText("Third")).toBeInTheDocument();
  });

  it("steps with the arrow keys and wraps", async () => {
    renderCarousel();
    screen.getByRole("group").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByText("Second")).toBeInTheDocument();
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.getByText("Last")).toBeInTheDocument();
  });

  it("ignores arrow keys pressed on controls inside the carousel", async () => {
    renderCarousel();
    screen.getByRole("button", { name: "Go to pair 3" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByText("First")).toBeInTheDocument();
  });

  it("stays valid when the list shrinks", async () => {
    const { rerender } = renderCarousel();
    await userEvent.click(screen.getByRole("button", { name: "Go to pair 4" }));
    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <PairCarousel pairs={pairs.slice(0, 2)} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("shows no navigation for a single pair", () => {
    renderCarousel([pairs[0]]);
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders nothing when there are no pairs", () => {
    const { container } = renderCarousel([]);
    expect(container).toBeEmptyDOMElement();
  });
});
