import { API_REFERENCE_BASE_PATH } from "../../api-reference.config";

import { parseApiSourceRegistry } from "./schema";

export type ScalarSource = {
  title: string;
  slug: string;
  url: string;
  default: boolean;
};

export async function loadApiSources(
  fetcher: typeof fetch = globalThis.fetch,
): Promise<ScalarSource[]> {
  const registryUrl = `${API_REFERENCE_BASE_PATH}specs/registry.json`;
  const response = await fetcher(registryUrl, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(
      `Failed to load API source registry (status=${response.status})`,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error(
      "Failed to parse API source registry (reason=invalid_json)",
    );
  }

  const registry = parseApiSourceRegistry(payload);
  return registry.sources.map((source) => ({
    title: source.title,
    slug: source.slug,
    url: `${API_REFERENCE_BASE_PATH}specs/${source.path}`,
    default: source.default,
  }));
}
