import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { YouTubeFacade } from "./YouTubeFacade";

function renderFacade() {
  return render(
    <YouTubeFacade videoId="abc123" title="Resort chimney" playLabel="Play video: Resort chimney" />,
  );
}

describe("YouTubeFacade", () => {
  it("shows a play button and no iframe before activation", () => {
    renderFacade();
    expect(screen.getByRole("button", { name: "Play video: Resort chimney" })).toBeInTheDocument();
    expect(screen.queryByTitle("Resort chimney")).not.toBeInTheDocument();
  });

  it("loads the embed iframe after the play button is clicked", async () => {
    renderFacade();
    await userEvent.click(screen.getByRole("button", { name: "Play video: Resort chimney" }));

    const iframe = screen.getByTitle("Resort chimney");
    expect(iframe).toBeInTheDocument();
    expect(iframe.getAttribute("src")).toContain("youtube-nocookie.com/embed/abc123");
  });
});
