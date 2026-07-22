import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { validateSpecDirectory } from "./validate-specs";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const fixtureDirectory = (name: string) =>
  resolve(testDirectory, "fixtures", name);

describe("OpenAPI specification validation", () => {
  it("accepts a registry whose sources contain valid OpenAPI documents", async () => {
    await expect(
      validateSpecDirectory(fixtureDirectory("valid")),
    ).resolves.toEqual({ sourceCount: 1 });
  });

  it("accepts an empty registry", async () => {
    await expect(
      validateSpecDirectory(fixtureDirectory("empty")),
    ).resolves.toEqual({ sourceCount: 0 });
  });

  it("identifies a source whose file is missing", async () => {
    await expect(
      validateSpecDirectory(fixtureDirectory("missing")),
    ).rejects.toThrow(
      "OpenAPI source file is missing (sourceId=moderation, path=service-moderation/openapi.json)",
    );
  });

  it("identifies a source whose OpenAPI document is invalid", async () => {
    await expect(
      validateSpecDirectory(fixtureDirectory("invalid")),
    ).rejects.toThrow(
      "OpenAPI source validation failed (sourceId=moderation, path=service-moderation/openapi.json)",
    );
  });
});
