#!/usr/bin/env sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
if [ ! -s "$ROOT/.runtime/opencode.json" ] || [ ! -s "$ROOT/.runtime/opencode.env" ]; then
  printf '%s\n' "OpenCode config missing: run docker compose up --build first." >&2
  exit 1
fi
FREELLMAPI_API_KEY="$(sed -n 's/^FREELLMAPI_API_KEY=//p' "$ROOT/.runtime/opencode.env")"
export FREELLMAPI_API_KEY
# Read the single generated file; leave the caller's project directory unchanged.
OPENCODE_CONFIG_CONTENT="$(cat "$ROOT/.runtime/opencode.json")"
export OPENCODE_CONFIG_CONTENT
exec opencode "$@"
