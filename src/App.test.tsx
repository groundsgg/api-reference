import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

const { loadApiSourcesMock } = vi.hoisted(() => ({
  loadApiSourcesMock: vi.fn(),
}));

vi.mock("./registry/load-registry", () => ({
  loadApiSources: loadApiSourcesMock,
}));

vi.mock("@scalar/api-reference-react", () => ({
  ApiReferenceReact: ({ configuration }: { configuration: unknown }) => (
    <pre data-testid="scalar-configuration">
      {JSON.stringify(configuration)}
    </pre>
  ),
}));

describe("App", () => {
  beforeEach(() => {
    loadApiSourcesMock.mockReset();
  });

  it("shows a loading state while the registry request is pending", () => {
    loadApiSourcesMock.mockReturnValue(new Promise(() => undefined));

    render(<App />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading API reference…",
    );
  });

  it("shows an empty state for an empty registry", async () => {
    loadApiSourcesMock.mockResolvedValue([]);

    render(<App />);

    expect(
      await screen.findByText("No APIs have been published yet."),
    ).toBeInTheDocument();
  });

  it("shows an error state when the registry cannot be loaded", async () => {
    loadApiSourcesMock.mockRejectedValue(new Error("unavailable"));

    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The API reference could not be loaded.",
    );
  });

  it("configures Scalar with safe same-origin sources", async () => {
    loadApiSourcesMock.mockResolvedValue([
      {
        title: "Moderation API",
        slug: "moderation",
        url: "/docs/specs/service-moderation/openapi.json",
        default: true,
      },
    ]);

    render(<App />);

    await waitFor(() =>
      expect(screen.getByTestId("scalar-configuration")).toBeInTheDocument(),
    );
    const configuration = JSON.parse(
      screen.getByTestId("scalar-configuration").textContent ?? "{}",
    );

    expect(configuration).toMatchObject({
      title: "Grounds API Reference",
      pathRouting: { basePath: "/docs" },
      hideClientButton: true,
      hideDownloadButton: false,
      showSidebar: true,
      sources: [
        {
          title: "Moderation API",
          slug: "moderation",
          url: "/docs/specs/service-moderation/openapi.json",
          default: true,
        },
      ],
    });
    expect(configuration).not.toHaveProperty("proxyUrl");
    expect(configuration).not.toHaveProperty("authentication");
  });
});
