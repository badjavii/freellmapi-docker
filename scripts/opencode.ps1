$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$configPath = Join-Path $root ".runtime/opencode.json"
$keyPath = Join-Path $root ".runtime/opencode.env"
if (-not (Test-Path $configPath) -or -not (Test-Path $keyPath)) {
  throw "OpenCode config missing: run docker compose up --build first."
}
$line = Get-Content $keyPath -Raw
$env:FREELLMAPI_API_KEY = ($line.Trim() -split "=",2)[1]
$env:OPENCODE_CONFIG_CONTENT = Get-Content $configPath -Raw
& opencode @args
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
