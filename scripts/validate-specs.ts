import { readFile, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { validate } from "@scalar/openapi-parser";

import { parseApiSourceRegistry } from "../src/registry/schema";

type ValidationSummary = {
  sourceCount: number;
};

async function readRegistry(specDirectory: string) {
  const registryPath = resolve(specDirectory, "registry.json");

  try {
    const contents = await readFile(registryPath, "utf8");
    return parseApiSourceRegistry(JSON.parse(contents) as unknown);
  } catch {
    throw new Error(
      "OpenAPI source registry validation failed (path=registry.json)",
    );
  }
}

export async function validateSpecDirectory(
  specDirectory: string,
): Promise<ValidationSummary> {
  const resolvedSpecDirectory = resolve(specDirectory);
  const registry = await readRegistry(resolvedSpecDirectory);

  for (const source of registry.sources) {
    const sourcePath = resolve(resolvedSpecDirectory, source.path);
    const relativeSourcePath = relative(resolvedSpecDirectory, sourcePath);

    if (relativeSourcePath.startsWith("..") || isAbsolute(relativeSourcePath)) {
      throw new Error(
        `OpenAPI source path is invalid (sourceId=${source.id}, path=${source.path})`,
      );
    }

    try {
      const sourceStats = await stat(sourcePath);
      if (!sourceStats.isFile()) {
        throw new Error("not_a_file");
      }
    } catch {
      throw new Error(
        `OpenAPI source file is missing (sourceId=${source.id}, path=${source.path})`,
      );
    }

    let contents: string;
    try {
      contents = await readFile(sourcePath, "utf8");
    } catch {
      throw new Error(
        `OpenAPI source file is missing (sourceId=${source.id}, path=${source.path})`,
      );
    }

    try {
      const result = await validate(contents);
      if (result.valid) {
        continue;
      }
    } catch {
      // The stable error below intentionally omits parser details and contents.
    }

    throw new Error(
      `OpenAPI source validation failed (sourceId=${source.id}, path=${source.path})`,
    );
  }

  return { sourceCount: registry.sources.length };
}

const invokedScript = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : undefined;

if (invokedScript === import.meta.url) {
  validateSpecDirectory(resolve("public/specs"))
    .then(({ sourceCount }) => {
      process.stdout.write(
        `OpenAPI specifications validated successfully (sourceCount=${sourceCount})\n`,
      );
    })
    .catch((error: unknown) => {
      const reason = error instanceof Error ? error.message : "unknown_error";
      process.stderr.write(`Failed to validate OpenAPI specifications (${reason})\n`);
      process.exitCode = 1;
    });
}
