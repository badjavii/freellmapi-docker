$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
Write-Host "[setup] Downloading pinned FreeLLMAPI source (shallow checkout)..."
& git submodule update --init --recursive --depth 1 --progress
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
if (-not (Test-Path "upstream/Dockerfile")) {
  throw "[ERROR] upstream/Dockerfile is missing. Retry the shallow submodule checkout."
}
Write-Host "[setup] Source checkout completed."
& (Join-Path $PSScriptRoot "vault.ps1") unlock
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
