#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
docker compose --profile tools run --build --rm --user "$(id -u):$(id -g)" vault "$@"
