$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
& git submodule update --init --recursive
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& (Join-Path $PSScriptRoot "vault.ps1") unlock
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
