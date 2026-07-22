import { describe, expect, it } from "vitest";

import { parseReleaseVersion } from "./release-version";

describe("release version parsing", () => {
  it.each(["0.0.0", "1.2.3", "1.2.3-rc.1"])(
    "accepts OCI-safe SemVer %s",
    (version) => {
      expect(parseReleaseVersion(version)).toBe(version);
    },
  );

  it.each([
    "01.2.3",
    "1.02.3",
    "1.2.03",
    "1.2",
    "1.2.3-.",
    "1.2.3-01",
    "1.2.3+build.1",
    "v1.2.3",
  ])("rejects invalid or OCI-unsafe version %s", (version) => {
    expect(() => parseReleaseVersion(version)).toThrow(
      `Invalid release version (version=${version})`,
    );
  });
});
