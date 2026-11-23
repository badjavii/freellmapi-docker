$ErrorActionPreference = "Stop"
& (Join-Path $PSScriptRoot "vault.ps1") unlock
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
