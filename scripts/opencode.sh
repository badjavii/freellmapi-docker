#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
if [ ! -s .runtime/opencode.json ] || [ ! -s .runtime/opencode.env ]; then
  printf '%s\n' "OpenCode config missing: run docker compose up --build first." >&2
  exit 1
fi
FREELLMAPI_API_KEY="$(sed -n 's/^FREELLMAPI_API_KEY=//p' .runtime/opencode.env)"
export FREELLMAPI_API_KEY
# OpenCode v2 supports inline config; no second copy is written to ~/.config.
OPENCODE_CONFIG_CONTENT="$(cat .runtime/opencode.json)"
export OPENCODE_CONFIG_CONTENT
exec opencode "$@"
