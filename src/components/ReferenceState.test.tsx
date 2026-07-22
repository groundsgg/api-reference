import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReferenceState } from "./ReferenceState";

describe("ReferenceState", () => {
  it("renders an accessible loading state", () => {
    render(<ReferenceState state="loading" />);

    expect(
      screen.getByRole("status", { name: "Loading API reference…" }),
    ).toBeInTheDocument();
  });

  it("renders an empty state without an alert", () => {
    render(<ReferenceState state="empty" />);

    expect(
      screen.getByRole("heading", { name: "Grounds API Reference" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No APIs have been published yet."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("uses an alert only for the error state", () => {
    render(<ReferenceState state="error" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The API reference could not be loaded.",
    );
  });
});
