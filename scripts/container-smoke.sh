#!/usr/bin/env bash

set -euo pipefail

image_tag="api-reference:smoke"
container_name="api-reference-smoke-${RANDOM}-$$"
container_id=""

cleanup() {
  if [[ -n "${container_id}" ]]; then
    docker rm --force "${container_id}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

docker build --tag "${image_tag}" .

container_id="$(
  docker run \
    --detach \
    --name "${container_name}" \
    --publish 127.0.0.1::8080 \
    "${image_tag}"
)"

published_address="$(docker port "${container_id}" 8080/tcp)"
port="${published_address##*:}"
base_url="http://127.0.0.1:${port}"

for _ in {1..50}; do
  if curl --fail --silent "${base_url}/docs/healthz" >/dev/null; then
    break
  fi
  sleep 0.2
done

test "$(curl --silent --output /dev/null --write-out '%{http_code}' "${base_url}/docs")" = "308"
test "$(curl --silent --head "${base_url}/docs" | tr -d '\r' | sed -n 's/^Location: //p')" = "/docs/"
index_html="$(curl --fail --silent "${base_url}/docs/")"
printf '%s' "${index_html}" | grep "Grounds API Reference" >/dev/null
curl --fail --silent "${base_url}/docs/specs/registry.json" | grep '"schemaVersion": 1' >/dev/null
test "$(curl --fail --silent "${base_url}/docs/healthz")" = "ok"
test "$(curl --silent --output /dev/null --write-out '%{http_code}' "${base_url}/")" = "404"
test -n "$(docker image inspect --format '{{.Config.User}}' "${image_tag}")"

asset_path="$(printf '%s' "${index_html}" | sed -n 's/.*src="\([^"]*\/assets\/[^"]*\)".*/\1/p')"
test -n "${asset_path}"

curl --fail --silent --head "${base_url}${asset_path}" \
  | tr -d '\r' \
  | grep --ignore-case '^Cache-Control: public, max-age=31536000, immutable$' >/dev/null

curl --fail --silent --head "${base_url}/docs/specs/registry.json" \
  | tr -d '\r' \
  | grep --ignore-case '^Cache-Control: public, max-age=300$' >/dev/null

curl --fail --silent --head "${base_url}/docs/" \
  | tr -d '\r' \
  | grep --ignore-case '^Cache-Control: no-cache$' >/dev/null

if curl --silent --head "${base_url}/docs/healthz" \
  | tr -d '\r' \
  | grep --ignore-case '^Server: nginx/' >/dev/null; then
  echo "Server header exposes the nginx version" >&2
  exit 1
fi

echo "Container smoke test passed (image=${image_tag})"
