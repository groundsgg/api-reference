import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { valid } from "semver";

export function parseReleaseVersion(version: string): string {
  if (
    version.includes("+") ||
    valid(version, { loose: false }) !== version
  ) {
    throw new Error(`Invalid release version (version=${version})`);
  }

  return version;
}

const invokedScript = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : undefined;

if (invokedScript === import.meta.url) {
  try {
    process.stdout.write(`${parseReleaseVersion(process.argv[2] ?? "")}\n`);
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : "unknown_error";
    process.stderr.write(`Failed to validate release version (${reason})\n`);
    process.exitCode = 1;
  }
}
