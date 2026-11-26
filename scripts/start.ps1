$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
if (-not (Test-Path .runtime/providers.json) -or -not (Test-Path .runtime/app.env)) {
  throw "Run .\scripts\unlock.ps1 first"
}
& docker compose up -d --build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
