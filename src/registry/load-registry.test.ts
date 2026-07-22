import { describe, expect, it, vi } from "vitest";

import { loadApiSources } from "./load-registry";

describe("API source registry loader", () => {
  it("maps registry entries to same-origin Scalar sources", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          schemaVersion: 1,
          sources: [
            {
              id: "moderation",
              title: "Moderation API",
              slug: "moderation",
              path: "service-moderation/openapi.json",
              default: true,
            },
          ],
        }),
      ),
    );

    await expect(loadApiSources(fetcher)).resolves.toEqual([
      {
        title: "Moderation API",
        slug: "moderation",
        url: "/docs/specs/service-moderation/openapi.json",
        default: true,
      },
    ]);
    expect(fetcher).toHaveBeenCalledWith("/docs/specs/registry.json", {
      cache: "no-store",
    });
  });

  it("rejects non-successful registry responses", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 503 }));

    await expect(loadApiSources(fetcher)).rejects.toThrow(
      "Failed to load API source registry (status=503)",
    );
  });

  it("rejects invalid registry JSON", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("not-json"));

    await expect(loadApiSources(fetcher)).rejects.toThrow(
      "Failed to parse API source registry (reason=invalid_json)",
    );
  });
});
