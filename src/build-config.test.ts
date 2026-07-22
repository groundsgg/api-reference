import { describe, expect, it } from "vitest";

import config from "../vite.config";

describe("Vite deployment contract", () => {
  it("builds exclusively for the /docs/ base path", () => {
    expect(config.base).toBe("/docs/");
  });

  it("treats the pinned Scalar bundle size as an expected vendor cost", () => {
    expect(config.build?.chunkSizeWarningLimit).toBe(2_500);
  });
});
