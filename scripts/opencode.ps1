$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
if (-not (Test-Path .runtime/opencode.json) -or -not (Test-Path .runtime/opencode.env)) {
  throw "OpenCode config missing: run docker compose up --build first."
}
$line = Get-Content .runtime/opencode.env -Raw
$env:FREELLMAPI_API_KEY = ($line.Trim() -split "=",2)[1]
$env:OPENCODE_CONFIG = (Resolve-Path .runtime/opencode.json).Path
& opencode @args
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
