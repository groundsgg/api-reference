import { describe, expect, it } from "vitest";

import worker, { type WorkerEnv } from "./index";

const ORIGIN = "https://apidocs-demo.grounds.workers.dev";

const assets = new Map<string, string>([
  ["/index.html", "<title>Grounds API Reference</title>"],
  ["/assets/index-abc123.js", "console.log('bundle');"],
  ["/specs/registry.json", '{ "schemaVersion": 1, "sources": [] }'],
]);

function createEnv(): WorkerEnv {
  return {
    ASSETS: {
      // Mirrors the deployed asset server, which is configured to resolve exact
      // paths only (`html_handling: "none"`).
      async fetch(input: Request | string) {
        const url = new URL(typeof input === "string" ? input : input.url);
        const body = assets.get(url.pathname);

        if (body === undefined) {
          return new Response("Not Found", { status: 404 });
        }

        return new Response(body, { status: 200 });
      },
    },
  } as unknown as WorkerEnv;
}

async function get(pathname: string): Promise<Response> {
  return worker.fetch(new Request(`${ORIGIN}${pathname}`), createEnv());
}

describe("API reference Worker", () => {
  it("redirects the origin root to the base path", async () => {
    const response = await get("/");

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("/docs/");
  });

  it("redirects the base path without a trailing slash", async () => {
    const response = await get("/docs");

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("/docs/");
  });

  it("serves the application shell below the base path", async () => {
    const response = await get("/docs/");

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-cache");
    await expect(response.text()).resolves.toContain("Grounds API Reference");
  });

  it("serves hashed bundles as immutable", async () => {
    const response = await get("/docs/assets/index-abc123.js");

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
  });

  it("serves specification snapshots with a short cache lifetime", async () => {
    const response = await get("/docs/specs/registry.json");

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("public, max-age=300");
  });

  it("answers the health endpoint", async () => {
    const response = await get("/docs/healthz");

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("ok");
  });

  it("falls back to the application shell for client-routed paths", async () => {
    const response = await get("/docs/permissions");

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toContain("Grounds API Reference");
  });

  it("does not fall back for missing bundles or specifications", async () => {
    await expect(
      get("/docs/assets/missing.js").then((response) => response.status),
    ).resolves.toBe(404);
    await expect(
      get("/docs/specs/missing.json").then((response) => response.status),
    ).resolves.toBe(404);
  });

  it("rejects paths outside the base path", async () => {
    const response = await get("/internal");

    expect(response.status).toBe(404);
  });
});
