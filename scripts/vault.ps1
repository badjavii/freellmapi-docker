param([Parameter(Mandatory=$true)][string]$Action, [string]$Provider)
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
$argsList = @("compose", "--profile", "tools", "run", "--build", "--rm", "vault", $Action)
if ($Provider) { $argsList += $Provider }
& docker @argsList
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
