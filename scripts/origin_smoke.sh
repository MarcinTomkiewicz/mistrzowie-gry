#!/usr/bin/env bash
set -Eeuo pipefail

ORIGIN_BASE_URL="${1:?Missing origin base URL}"
PUBLIC_HOST="mistrzowie-gry.pl"
SITE_URL="https://mistrzowie-gry.pl"
EXPECTED_CACHE_CONTROL="public, max-age=300, s-maxage=900, stale-if-error=86400"
SMOKE_DIR="$(mktemp -d /tmp/mistrzowie-gry-origin-smoke.XXXXXX)"

cleanup() {
  rm -rf -- "$SMOKE_DIR"
}

fail() {
  echo "[origin-smoke] ERROR: $*" >&2
  return 1
}

fetch_origin() {
  local path="$1"
  local key="${path//\//_}"
  local body_path="$SMOKE_DIR/${key:-root}.body"
  local headers_path="$SMOKE_DIR/${key:-root}.headers"
  local status

  status="$(
    curl \
      --silent \
      --show-error \
      --connect-timeout 5 \
      --max-time 30 \
      --header "Host: $PUBLIC_HOST" \
      --dump-header "$headers_path" \
      --output "$body_path" \
      --write-out "%{http_code}" \
      "$ORIGIN_BASE_URL$path"
  )"

  printf '%s\t%s\t%s\n' "$status" "$body_path" "$headers_path"
}

wait_for_origin() {
  local attempt
  local response
  local status

  for attempt in {1..15}; do
    if response="$(fetch_origin '/')"; then
      IFS=$'\t' read -r status _ _ <<< "$response"

      if [[ "$status" == "200" ]]; then
        return 0
      fi
    fi

    sleep 2
  done

  fail "Origin did not become ready"
}

smoke_html() {
  local path="$1"
  local expected_marker="${2:?Missing route-specific expected marker}"
  local response
  local status
  local body_path
  local headers_path

  response="$(fetch_origin "$path")"
  IFS=$'\t' read -r status body_path headers_path <<< "$response"

  [[ "$status" == "200" ]] || fail "$path returned HTTP $status"
  grep -Eiq '^content-type:.*text/html' "$headers_path" ||
    fail "$path did not return HTML"
  grep -Eiq '<app-root([ >])' "$body_path" ||
    fail "$path is missing the Angular shell"
  grep -Eiq '<h1([ >])' "$body_path" ||
    fail "$path is missing rendered page content"
  grep -Eiq '</html>' "$body_path" ||
    fail "$path returned incomplete HTML"
  grep -Fq "$expected_marker" "$body_path" ||
    fail "$path is missing its route-specific marker"

  if grep -Eiq 'noindex' "$body_path"; then
    fail "$path returned noindex success HTML"
  fi

  if grep -Eiq 'nav\.|legal\.|undefined|Just a moment\.\.\.' "$body_path"; then
    fail "$path contains an unresolved shell, translation, or challenge marker"
  fi
}

require_runtime_cache_control() {
  local headers_path="$1"
  local resource="$2"

  grep -Eiq \
    "^cache-control:[[:space:]]*$EXPECTED_CACHE_CONTROL[[:space:]]*$" \
    "$headers_path" ||
    fail "$resource has invalid runtime Cache-Control"
}

smoke_sitemap() {
  local response
  local status
  local body_path
  local headers_path

  response="$(fetch_origin '/sitemap.xml')"
  IFS=$'\t' read -r status body_path headers_path <<< "$response"

  [[ "$status" == "200" ]] || fail "/sitemap.xml returned HTTP $status"
  grep -Eiq '^content-type:.*(application|text)/xml' "$headers_path" ||
    fail "/sitemap.xml did not return XML"
  grep -Fq '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' "$body_path" ||
    fail "/sitemap.xml is missing urlset"
  grep -Fq "<loc>$SITE_URL/</loc>" "$body_path" ||
    fail "/sitemap.xml is missing the canonical root URL"
  grep -Fq "<loc>$SITE_URL/artykuly</loc>" "$body_path" ||
    fail "/sitemap.xml is missing /artykuly"
  grep -Fq "<loc>$SITE_URL/offer/oferta-indywidualna</loc>" "$body_path" ||
    fail "/sitemap.xml is missing the representative active offer"

  if grep -Eiq '<(priority|changefreq)([ >])' "$body_path"; then
    fail "/sitemap.xml contains unsupported priority or changefreq"
  fi

  require_runtime_cache_control "$headers_path" "/sitemap.xml"
}

smoke_robots() {
  local response
  local status
  local body_path
  local headers_path

  response="$(fetch_origin '/robots.txt')"
  IFS=$'\t' read -r status body_path headers_path <<< "$response"

  [[ "$status" == "200" ]] || fail "/robots.txt returned HTTP $status"
  grep -Eiq '^content-type:.*text/plain' "$headers_path" ||
    fail "/robots.txt did not return plain text"
  grep -Fxq 'User-agent: *' "$body_path" ||
    fail "/robots.txt is missing User-agent"
  grep -Fxq 'Allow: /' "$body_path" ||
    fail "/robots.txt is not indexable"
  grep -Fxq 'Disallow: /admin/' "$body_path" ||
    fail "/robots.txt is missing the admin disallow rule"
  grep -Fxq 'Disallow: /auth/' "$body_path" ||
    fail "/robots.txt is missing the auth disallow rule"
  grep -Fxq 'Disallow: /preview/' "$body_path" ||
    fail "/robots.txt is missing the preview disallow rule"
  grep -Fxq "Sitemap: $SITE_URL/sitemap.xml" "$body_path" ||
    fail "/robots.txt is missing the sitemap URL"
  require_runtime_cache_control "$headers_path" "/robots.txt"
}

trap cleanup EXIT

wait_for_origin
smoke_html '/' "<link rel=\"canonical\" href=\"$SITE_URL/\">"
smoke_html \
  '/offer/oferta-indywidualna' \
  "<link rel=\"canonical\" href=\"$SITE_URL/offer/oferta-indywidualna\">"
smoke_html \
  '/our-team' \
  "<link rel=\"canonical\" href=\"$SITE_URL/our-team\">"
smoke_html \
  '/artykuly' \
  "<link rel=\"canonical\" href=\"$SITE_URL/artykuly\">"
smoke_sitemap
smoke_robots

echo "[origin-smoke] all checks passed"
