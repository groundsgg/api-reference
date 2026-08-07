# Grounds API Reference

This repository builds the public, central OpenAPI reference for Grounds services. It renders versioned specification snapshots with Scalar and is deployed as a Cloudflare Worker at [apidocs-demo.grounds.workers.dev/docs](https://apidocs-demo.grounds.workers.dev/docs/).

The application is self-contained: it never fetches specifications from running services and does not require service credentials at runtime. Until the first API is published, the empty registry produces a supported empty state.

## Architecture

Service repositories generate and validate their own OpenAPI documents. A reviewable integration pull request copies a released snapshot into this repository and updates the source registry. CI validates the registry and every referenced document before building the static application and the Worker that serves it.

```text
service release -> snapshot pull request -> api-reference build -> Cloudflare Worker -> /docs
```

The Worker in `worker/index.ts` owns routing. Static assets are uploaded with the Worker and read through its `ASSETS` binding: the Worker redirects `/` to `/docs/`, strips the `/docs` base path before reading an asset, answers `/docs/healthz`, falls back to the application shell for client-routed paths, and returns `404` outside `/docs`.

## Local development

Requirements:

- Node.js 24
- npm
- A Cloudflare account with Workers access, when deploying

Install dependencies and start Vite:

```shell
npm ci
npm run dev
```

Vite serves the application with the production base path at `http://localhost:5173/docs/`.

Run the project checks:

```shell
npm run validate:specs
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run build` always runs specification validation before the TypeScript and Vite builds.

## Publishing an API source

Add the released OpenAPI document at:

```text
public/specs/<service>/openapi.json
```

JSON, YAML, and YML documents are supported. The checked-in file must be a versioned snapshot, not a URL or a runtime download.

Then add the source to `public/specs/registry.json`. This is a documentation example only; it is not part of the production registry:

```json
{
  "schemaVersion": 1,
  "sources": [
    {
      "id": "example-service",
      "title": "Example API",
      "slug": "example",
      "path": "example-service/openapi.json",
      "default": true
    }
  ]
}
```

The registry contract is intentionally small:

- `schemaVersion` must be `1`.
- `id`, `slug`, and `path` must each be unique.
- A non-empty registry must contain exactly one source with `default: true`.
- Paths are relative to `public/specs/` and may not be absolute, contain `..`, or use a URL scheme.
- Source IDs and slugs use lowercase kebab case.
- Titles are non-empty and at most 80 characters.

Live service URLs, internal hostnames, private repository URLs, credentials, and authentication defaults must never be added. Scalar only receives same-origin URLs below `/docs/specs/`; its API client, proxy, and preconfigured authentication are disabled.

### Review checklist

- [ ] The snapshot was generated from a released or otherwise explicitly reviewed service revision.
- [ ] The service repository validated the generated OpenAPI document.
- [ ] The snapshot contains no secrets, internal hostnames, or private repository URLs.
- [ ] The registry source points to the checked-in file and preserves exactly one default source.
- [ ] The source ID, slug, and path do not duplicate another entry.
- [ ] `npm run validate:specs`, `npm test`, and `npm run build` pass.
- [ ] The pull request links the source release or commit that produced the snapshot.

Service pipelines may automate creation of the integration pull request later, but the snapshot and registry changes remain reviewable repository changes.

## Worker

Build the application and run the deployed Worker locally:

```shell
npm run preview:worker
```

Available endpoints, identical locally and in production:

- `/` and `/docs` redirect permanently to `/docs/`.
- `/docs/` serves the application, with `Cache-Control: no-cache`.
- `/docs/assets/…` serves hashed bundles as `public, max-age=31536000, immutable`.
- `/docs/specs/registry.json` serves the source registry as `public, max-age=300`.
- `/docs/healthz` returns `ok`.
- Paths outside `/docs` return `404`.

`worker/index.test.ts` covers this routing contract; CI additionally builds the Worker bundle with `wrangler deploy --dry-run`.

Deploy manually from a Cloudflare-authenticated shell:

```shell
npm run deploy
```

## Releases

Release Please creates releases from Conventional Commits. Tags follow `api-reference-v<version>` and deploy the Worker `apidocs-demo` from the tagged revision.

The release workflow needs two repository secrets:

- `CLOUDFLARE_API_TOKEN` with the `Workers Scripts: Edit` permission
- `CLOUDFLARE_ACCOUNT_ID`

## Responsibility boundaries

- **Service repositories** own OpenAPI generation, service-level validation, and the source revision represented by a snapshot.
- **This repository** owns the public registry, snapshot validation, Scalar rendering, the Worker that serves it, and its release pipeline.
- **Cloudflare** owns hosting and TLS. Custom domains and Worker routes are configured on the account, not in this repository.
- **`groundsgg/docs`** owns the Mintlify navigation entry that links to the deployed API reference.

DNS, Cloudflare account configuration, Mintlify navigation, service-specific generation, cross-repository pull-request automation, SDK generation, AsyncAPI, and authenticated API requests are outside this repository.

Implementation is tracked in [GitHub issue #1](https://github.com/groundsgg/api-reference/issues/1) and the [API01.1 implementation plan](https://grounds.atlassian.net/wiki/spaces/gkd/pages/242909186).
