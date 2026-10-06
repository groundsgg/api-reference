import { API_REFERENCE_BASE_PATH } from "../api-reference.config";

export type WorkerEnv = {
  ASSETS: Fetcher;
};

const BASE_PATH = API_REFERENCE_BASE_PATH.replace(/\/$/, "");
const ASSET_PREFIX = "/assets/";
const SPEC_PREFIX = "/specs/";

function cacheControlFor(assetPathname: string): string {
  if (assetPathname.startsWith(ASSET_PREFIX)) {
    return "public, max-age=31536000, immutable";
  }

  if (assetPathname.startsWith(SPEC_PREFIX)) {
    return "public, max-age=300";
  }

  return "no-cache";
}

function withCacheControl(response: Response, assetPathname: string): Response {
  const result = new Response(response.body, response);
  result.headers.set("cache-control", cacheControlFor(assetPathname));
  return result;
}

async function fetchAsset(
  env: WorkerEnv,
  request: Request,
  url: URL,
  assetPathname: string,
): Promise<Response> {
  const assetUrl = new URL(url);
  assetUrl.pathname = assetPathname;
  assetUrl.search = "";

  return env.ASSETS.fetch(new Request(assetUrl, request));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === "/" || pathname === BASE_PATH) {
      return new Response(null, {
        status: 308,
        headers: { location: `${BASE_PATH}/` },
      });
    }

    if (pathname === `${BASE_PATH}/healthz`) {
      return new Response("ok", {
        headers: {
          "cache-control": "no-store",
          "content-type": "text/plain; charset=utf-8",
        },
      });
    }

    if (!pathname.startsWith(`${BASE_PATH}/`)) {
      return new Response("Not Found", { status: 404 });
    }

    const assetPathname = pathname.slice(BASE_PATH.length);
    const assetResponse = await fetchAsset(env, request, url, assetPathname);

    if (assetResponse.status !== 404) {
      return withCacheControl(assetResponse, assetPathname);
    }

    // Hashed bundles and specification snapshots must fail loudly instead of
    // resolving to the application shell.
    if (
      assetPathname.startsWith(ASSET_PREFIX) ||
      assetPathname.startsWith(SPEC_PREFIX)
    ) {
      return assetResponse;
    }

    const indexResponse = await fetchAsset(env, request, url, "/index.html");
    return withCacheControl(indexResponse, "/index.html");
  },
} satisfies ExportedHandler<WorkerEnv>;
