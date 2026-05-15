# Start Enterprise ERP backend on a single port (5000): Auth, Company, HR, Attendance,
# Leave, Shift, Payroll, Notification in one process.
# Call all APIs through http://127.0.0.1:5000 only (NEXT_PUBLIC_API_URL=http://127.0.0.1:5000).
#
# Usage from repo root (parent of EnterpriseERP/):
#   pwsh -File EnterpriseERP/Infrastructure/Scripts/start-platform.ps1
#
# Prerequisites: SQL Server per Platform.Host appsettings.json
#
# To run microservices + gateway separately (5012/5020/5035 + 5000), start each Api project
# and Gateway.Api manually.
#
# PunchDataService (Go / Gin) runs as a separate process on http://127.0.0.1:5050.
# Pass -WithPunchData to also start it in a background window.

param(
    [switch]$SkipBuild,
    [switch]$WithPunchData
)

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$Sln = Join-Path $RepoRoot "EnterpriseERP\EnterpriseERP.slnx"

if (-not (Test-Path $Sln)) {
    Write-Error "Could not find EnterpriseERP.slnx at $Sln"
}

Set-Location $RepoRoot

if (-not $SkipBuild) {
    Write-Host "Building EnterpriseERP.slnx (Release)..."
    dotnet build $Sln -c Release
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

if ($WithPunchData) {
    $punchDir = Join-Path $RepoRoot "EnterpriseERP\Services\PunchDataService"
    if (Test-Path (Join-Path $punchDir "go.mod")) {
        Write-Host "Starting PunchDataService (Go) — http://127.0.0.1:5050 ..."
        Start-Process -FilePath "pwsh" -ArgumentList @("-NoExit", "-Command", "cd `"$punchDir`"; go run ./cmd/server") | Out-Null
    } else {
        Write-Warning "PunchDataService go.mod not found at $punchDir; skipping."
    }
}

$hostProj = Join-Path $RepoRoot "EnterpriseERP\Platform.Host\EnterpriseERP.Platform.Host.csproj"
Write-Host "Starting Platform.Host — http://127.0.0.1:5000 ..."
dotnet run --project $hostProj -c Release --no-build
