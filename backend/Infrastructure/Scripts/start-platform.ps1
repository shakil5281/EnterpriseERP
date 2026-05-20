# Start Enterprise ERP backend on a single port (5000)
# Usage: powershell -File backend/Infrastructure/Scripts/start-platform.ps1

param(
    [switch]$SkipBuild,
    [switch]$WithoutPunchData
)

$ErrorActionPreference = "Stop"

# Use automatic PSScriptRoot if available
if (-not $PSScriptRoot) {
    $PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
}

$BackendRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Sln = Join-Path $BackendRoot "EnterpriseERP.slnx"

if (-not (Test-Path $Sln)) {
    Write-Error "Could not find EnterpriseERP.slnx at $Sln"
}

Set-Location $BackendRoot

# Kill existing process if running on port 5000 (Platform.Host)
$existing = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Stopping existing process on port 5000 (PID: $($existing.OwningProcess))..."
    Stop-Process -Id $existing.OwningProcess -Force
}

# Kill existing Go process on port 5050 (PunchDataService)
$existingGo = Get-NetTCPConnection -LocalPort 5050 -ErrorAction SilentlyContinue
if ($existingGo) {
    Write-Host "Stopping existing Go process on port 5050 (PID: $($existingGo.OwningProcess))..."
    Stop-Process -Id $existingGo.OwningProcess -Force
}

if (-not $SkipBuild) {
    Write-Host "Building EnterpriseERP.slnx (Release)..."
    dotnet build $Sln -c Release
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}


if (-not $WithoutPunchData) {
    $punchDir = Join-Path $BackendRoot "Services\PunchDataService"
    $centralConn = Join-Path $BackendRoot "Configuration\connectionstrings.json"
    if (Test-Path (Join-Path $punchDir "go.mod")) {
        Write-Host "Starting PunchDataService (Go) -- http://127.0.0.1:5050 ..."
        $punchCmd = "cd `"$punchDir`""
        if (Test-Path $centralConn) {
            $punchCmd += "; `$env:ERP_CONNECTIONSTRINGS = '$centralConn'"
        }
        $punchCmd += "; go run ./cmd/server"
        Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", $punchCmd) | Out-Null
        Start-Sleep -Seconds 3
    }
}

$hostProj = Join-Path $BackendRoot "Platform.Host\EnterpriseERP.Platform.Host.csproj"
Write-Host "Starting Platform.Host -- http://127.0.0.1:5000 ..."
dotnet run --project $hostProj -c Release --no-build
