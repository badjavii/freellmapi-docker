#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."

printf '%s\n' "[setup] Downloading pinned FreeLLMAPI source (shallow checkout)..."
git submodule update --init --recursive --depth 1 --progress

if [ ! -f upstream/Dockerfile ]; then
  printf '%s\n' "[ERROR] upstream/Dockerfile is missing. Retry: git submodule update --init --recursive --depth 1 --progress" >&2
  exit 1
fi

printf '%s\n' "[setup] Source checkout completed."
exec ./scripts/vault.sh unlock
