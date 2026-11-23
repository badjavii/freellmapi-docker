#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
if [ ! -s .runtime/opencode.json ] || [ ! -s .runtime/opencode.env ]; then
  printf '%s\n' "OpenCode config missing: run docker compose up --build first." >&2
  exit 1
fi
FREELLMAPI_API_KEY="$(sed -n 's/^FREELLMAPI_API_KEY=//p' .runtime/opencode.env)"
export FREELLMAPI_API_KEY
OPENCODE_CONFIG="$(pwd)/.runtime/opencode.json"
export OPENCODE_CONFIG
exec opencode "$@"
