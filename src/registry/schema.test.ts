import { describe, expect, it } from "vitest";

import { parseApiSourceRegistry } from "./schema";

const source = {
  id: "moderation",
  title: "Moderation API",
  slug: "moderation",
  path: "service-moderation/openapi.json",
  default: true,
};

describe("API source registry", () => {
  it("accepts an empty version-one registry", () => {
    expect(
      parseApiSourceRegistry({ schemaVersion: 1, sources: [] }),
    ).toEqual({ schemaVersion: 1, sources: [] });
  });

  it("accepts one default source in a non-empty registry", () => {
    expect(
      parseApiSourceRegistry({ schemaVersion: 1, sources: [source] }),
    ).toEqual({ schemaVersion: 1, sources: [source] });
  });

  it.each([
    [[{ ...source, default: false }]],
    [[source, { ...source, id: "players", slug: "players", default: true }]],
  ])("requires exactly one default source for %j", (sources) => {
    expect(() =>
      parseApiSourceRegistry({ schemaVersion: 1, sources }),
    ).toThrow(/exactly one default source/i);
  });

  it.each([
    ["id", { ...source, slug: "second", path: "second/openapi.json" }],
    ["slug", { ...source, id: "second", path: "second/openapi.json" }],
    ["path", { ...source, id: "second", slug: "second" }],
  ])("rejects duplicate %s values", (field, duplicate) => {
    expect(() =>
      parseApiSourceRegistry({
        schemaVersion: 1,
        sources: [source, { ...duplicate, default: false }],
      }),
    ).toThrow(new RegExp(`source ${field} values must be unique`, "i"));
  });

  it.each([
    "../secret.json",
    "service/../secret.json",
    "/absolute.json",
    "https://service/openapi.json",
    "service/openapi.txt",
  ])("rejects unsafe source path %s", (path) => {
    expect(() =>
      parseApiSourceRegistry({
        schemaVersion: 1,
        sources: [{ ...source, path }],
      }),
    ).toThrow(/safe relative openapi path/i);
  });
});
