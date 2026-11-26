#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
if [ ! -s .runtime/providers.json ] || [ ! -s .runtime/app.env ]; then
  printf '%s\n' "Run ./scripts/unlock.sh first" >&2
  exit 1
fi
exec docker compose up -d --build
