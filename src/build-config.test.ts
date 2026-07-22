import { describe, expect, it } from "vitest";

import config from "../vite.config";

describe("Vite deployment contract", () => {
  it("builds exclusively for the /docs/ base path", () => {
    expect(config.base).toBe("/docs/");
  });
});
