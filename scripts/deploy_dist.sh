#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_ROOT="/var/www/mistrzowie-gry"
RELEASES_ROOT="$DEPLOY_ROOT/releases"
CURRENT_LINK="$DEPLOY_ROOT/current"
SHARED_ENV="$DEPLOY_ROOT/.env"
PROCESS_NAME="mistrzowie-gry-ssr"
PM2="/usr/bin/pm2"
PORT=4100
ORIGIN_BASE_URL="http://127.0.0.1:$PORT"
KEEP_RELEASES=5

ARCHIVE_PATH="${1:?Missing deployment archive path}"
DEPLOY_SHA="${2:?Missing deployment SHA}"
DEPLOY_RUN_ID="${3:?Missing workflow run ID}"
DEPLOY_RUN_ATTEMPT="${4:?Missing workflow run attempt}"
ORIGIN_SMOKE_SCRIPT="${5:?Missing origin smoke script path}"

if [[ ! "$DEPLOY_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "[deploy] ERROR: Deployment SHA must be a full lowercase Git SHA" >&2
  exit 1
fi

if [[ ! "$DEPLOY_RUN_ID" =~ ^[0-9]+$ ]]; then
  echo "[deploy] ERROR: Workflow run ID must be numeric" >&2
  exit 1
fi

if [[ ! "$DEPLOY_RUN_ATTEMPT" =~ ^[0-9]+$ ]]; then
  echo "[deploy] ERROR: Workflow run attempt must be numeric" >&2
  exit 1
fi

RELEASE_ID="$DEPLOY_SHA-$DEPLOY_RUN_ID-$DEPLOY_RUN_ATTEMPT"
RELEASE_DIR="$RELEASES_ROOT/$RELEASE_ID"
STAGING_DIR="$RELEASES_ROOT/.staging-$RELEASE_ID-$$"
STATE_DIR="/tmp/mistrzowie-gry-deploy-state-$RELEASE_ID-$$"

PREVIOUS_CURRENT_TARGET=""
PREVIOUS_PM2_SCRIPT=""
PREVIOUS_PM2_CWD=""
RELEASE_CREATED=false
DEPLOYMENT_SWITCHED=false
DEPLOYMENT_SUCCEEDED=false

umask 022

fail() {
  echo "[deploy] ERROR: $*" >&2
  return 1
}

cleanup() {
  rm -rf -- "$STAGING_DIR" "$STATE_DIR"

  if [[ "$ARCHIVE_PATH" == /tmp/mistrzowie-gry-dist-*.tgz ]]; then
    rm -f -- "$ARCHIVE_PATH"
  fi

  if [[ "$ORIGIN_SMOKE_SCRIPT" == /tmp/mistrzowie-gry-origin-smoke-*.sh ]]; then
    rm -f -- "$ORIGIN_SMOKE_SCRIPT"
  fi

  if [[ "$0" == /tmp/mistrzowie-gry-deploy-*.sh ]]; then
    rm -f -- "$0"
  fi
}

atomic_switch_current() {
  local target="$1"
  local temporary_link="$DEPLOY_ROOT/.current-$RELEASE_ID-$$"

  rm -f -- "$temporary_link"
  ln -s "$target" "$temporary_link"
  mv -Tf -- "$temporary_link" "$CURRENT_LINK"
}

start_pm2() {
  local script_path="$1"
  local working_directory="$2"

  "$PM2" delete "$PROCESS_NAME" >/dev/null 2>&1 || true
  APP_BASE_HREF=/ PORT="$PORT" NODE_ENV=production \
    "$PM2" start "$script_path" \
      --name "$PROCESS_NAME" \
      --cwd "$working_directory"
}

restore_previous_release() {
  echo "[deploy] rolling back failed release $RELEASE_ID"

  if [[ -n "$PREVIOUS_CURRENT_TARGET" ]]; then
    atomic_switch_current "$PREVIOUS_CURRENT_TARGET"
    start_pm2 "$CURRENT_LINK/server/server.mjs" "$CURRENT_LINK"
  elif [[ -n "$PREVIOUS_PM2_SCRIPT" ]]; then
    rm -f -- "$CURRENT_LINK"
    start_pm2 \
      "$PREVIOUS_PM2_SCRIPT" \
      "${PREVIOUS_PM2_CWD:-$(dirname "$PREVIOUS_PM2_SCRIPT")}"
  else
    rm -f -- "$CURRENT_LINK"
    "$PM2" delete "$PROCESS_NAME" >/dev/null 2>&1 || true
  fi

  "$PM2" save
  rm -rf -- "$RELEASE_DIR"
  DEPLOYMENT_SWITCHED=false
}

on_error() {
  local exit_code=$?
  trap - ERR

  if [[ "$DEPLOYMENT_SWITCHED" == true && "$DEPLOYMENT_SUCCEEDED" != true ]]; then
    restore_previous_release || echo "[deploy] rollback failed" >&2
  elif [[ "$RELEASE_CREATED" == true ]]; then
    rm -rf -- "$RELEASE_DIR"
  fi

  exit "$exit_code"
}

on_signal() {
  local signal="$1"
  trap - ERR HUP INT TERM

  echo "[deploy] interrupted by signal $signal" >&2

  if [[ "$DEPLOYMENT_SWITCHED" == true && "$DEPLOYMENT_SUCCEEDED" != true ]]; then
    restore_previous_release || echo "[deploy] rollback failed" >&2
  elif [[ "$RELEASE_CREATED" == true ]]; then
    rm -rf -- "$RELEASE_DIR"
  fi

  exit 1
}

validate_arguments() {
  [[ -f "$ARCHIVE_PATH" ]] || fail "Archive not found: $ARCHIVE_PATH"
  [[ -x "$ORIGIN_SMOKE_SCRIPT" ]] ||
    fail "Origin smoke script not found or not executable: $ORIGIN_SMOKE_SCRIPT"
  [[ -x "$PM2" ]] || fail "PM2 not found at $PM2"
  [[ -f "$SHARED_ENV" ]] || fail "Shared environment file not found: $SHARED_ENV"
  [[ ! -e "$RELEASE_DIR" ]] || fail "Release already exists: $RELEASE_ID"

  if [[ -e "$CURRENT_LINK" && ! -L "$CURRENT_LINK" ]]; then
    fail "$CURRENT_LINK must be a symlink before release deployment"
  fi

  for command in curl node tar; do
    command -v "$command" >/dev/null || fail "Required command not found: $command"
  done
}

capture_previous_state() {
  if [[ -L "$CURRENT_LINK" ]]; then
    PREVIOUS_CURRENT_TARGET="$(readlink -f "$CURRENT_LINK")"
  fi

  if "$PM2" describe "$PROCESS_NAME" >/dev/null 2>&1; then
    local pm2_state="$STATE_DIR/pm2-before.json"
    "$PM2" jlist > "$pm2_state"

    PREVIOUS_PM2_SCRIPT="$(
      node -e "
        const fs = require('node:fs');
        const [path, name] = process.argv.slice(1);
        const processInfo = JSON.parse(fs.readFileSync(path, 'utf8'))
          .find((entry) => entry.name === name);
        process.stdout.write(processInfo?.pm2_env?.pm_exec_path ?? '');
      " "$pm2_state" "$PROCESS_NAME"
    )"

    PREVIOUS_PM2_CWD="$(
      node -e "
        const fs = require('node:fs');
        const [path, name] = process.argv.slice(1);
        const processInfo = JSON.parse(fs.readFileSync(path, 'utf8'))
          .find((entry) => entry.name === name);
        process.stdout.write(processInfo?.pm2_env?.pm_cwd ?? '');
      " "$pm2_state" "$PROCESS_NAME"
    )"
  fi
}

validate_release() {
  local release_path="$1"
  local metadata_path="$release_path/deployment-metadata.json"

  [[ -s "$release_path/browser/index.html" ]] ||
    fail "Release is missing browser/index.html"
  [[ -s "$release_path/server/server.mjs" ]] ||
    fail "Release is missing server/server.mjs"
  [[ -s "$metadata_path" ]] ||
    fail "Release is missing deployment-metadata.json"

  node -e "
    const fs = require('node:fs');
    const [path, expectedSha, expectedRunId, expectedRunAttempt] =
      process.argv.slice(1);
    const metadata = JSON.parse(fs.readFileSync(path, 'utf8'));
    const builtAt = Date.parse(metadata.builtAt);

    if (
      metadata.sha !== expectedSha ||
      metadata.runId !== expectedRunId ||
      metadata.runAttempt !== Number(expectedRunAttempt) ||
      Number.isNaN(builtAt)
    ) {
      throw new Error('Deployment metadata does not match the workflow');
    }
  " "$metadata_path" "$DEPLOY_SHA" "$DEPLOY_RUN_ID" "$DEPLOY_RUN_ATTEMPT"
}

prune_releases() {
  local current_target
  local release
  local index
  local releases=()

  current_target="$(readlink -f "$CURRENT_LINK")"
  mapfile -t releases < <(
    find "$RELEASES_ROOT" \
      -mindepth 1 \
      -maxdepth 1 \
      -type d \
      -printf '%T@ %p\n' |
      sort -nr |
      cut -d' ' -f2-
  )

  for ((index = KEEP_RELEASES; index < ${#releases[@]}; index++)); do
    release="${releases[$index]}"

    if [[ "$release" != "$current_target" ]]; then
      rm -rf -- "$release"
    fi
  done
}

trap cleanup EXIT
trap on_error ERR
trap 'on_signal HUP' HUP
trap 'on_signal INT' INT
trap 'on_signal TERM' TERM

validate_arguments
mkdir -p "$RELEASES_ROOT" "$STATE_DIR"
capture_previous_state

echo "[deploy] staging release $RELEASE_ID"
mkdir "$STAGING_DIR"
tar xzf "$ARCHIVE_PATH" -C "$STAGING_DIR"
validate_release "$STAGING_DIR"
ln -s "$SHARED_ENV" "$STAGING_DIR/.env"
mv "$STAGING_DIR" "$RELEASE_DIR"
RELEASE_CREATED=true

echo "[deploy] activating release $RELEASE_ID"
atomic_switch_current "$RELEASE_DIR"
DEPLOYMENT_SWITCHED=true
start_pm2 "$CURRENT_LINK/server/server.mjs" "$CURRENT_LINK"

echo "[deploy] running origin smoke"
"$ORIGIN_SMOKE_SCRIPT" "$ORIGIN_BASE_URL"
"$PM2" save

DEPLOYMENT_SUCCEEDED=true
prune_releases || echo "[deploy] release pruning failed" >&2

echo "[deploy] release $RELEASE_ID deployed successfully"
