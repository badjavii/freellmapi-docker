#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
exec ./scripts/vault.sh unlock
