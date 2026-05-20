# Start Enterprise ERP Full Project (Backend + Frontend)
# Usage: powershell -ExecutionPolicy Bypass -File start-all.ps1

param(
    [switch]$SkipBackendBuild,
    [switch]$SkipFrontendBuild
)

$ErrorActionPreference = "Stop"

$RootDir = $PSScriptRoot
if (-not $RootDir) {
    $RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}

function Stop-PortProcess {
    param([int]$Port)

    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if (-not $connections) { return }

    $connections | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {
        Write-Host "Stopping process on port $Port (PID: $_)..."
        Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
    }
}

function Invoke-BuildStep {
    param(
        [string]$Label,
        [scriptblock]$Command
    )

    Write-Host "==> $Label..."
    & $Command
    if ($LASTEXITCODE -ne 0) {
        Write-Error "$Label failed (exit code $LASTEXITCODE). Stopping."
    }
    Write-Host "==> $Label succeeded."
}

Write-Host "==> Stopping existing processes..."
Stop-PortProcess -Port 5000  # Platform.Host
Stop-PortProcess -Port 5050  # PunchDataService
Stop-PortProcess -Port 8060  # ImportExportService
Stop-PortProcess -Port 3000  # Frontend (Next.js)

$BackendRoot = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "hrhub"
$Sln = Join-Path $BackendRoot "EnterpriseERP.slnx"

if (-not (Test-Path $Sln)) {
    Write-Error "Could not find EnterpriseERP.slnx at $Sln"
}

# Build backend first — exit before starting anything if it fails
Set-Location $BackendRoot
if (-not $SkipBackendBuild) {
    Invoke-BuildStep -Label "Building Backend" -Command { dotnet build $Sln }
}

# Build frontend — yarn start runs only after this succeeds
Set-Location $FrontendDir
if (-not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
    Invoke-BuildStep -Label "Installing frontend dependencies" -Command { yarn install }
}

if (-not $SkipFrontendBuild) {
    Invoke-BuildStep -Label "Building Frontend" -Command { yarn build }
}

Write-Host "==> All builds succeeded. Starting services..."

Set-Location $BackendRoot

$punchDir = Join-Path $BackendRoot "Services\PunchDataService"
$centralConn = Join-Path $BackendRoot "Configuration\connectionstrings.json"
if (Test-Path (Join-Path $punchDir "go.mod")) {
    Write-Host "Starting PunchDataService (Go) on port 5050..."
    $punchCmd = "cd `"$punchDir`""
    if (Test-Path $centralConn) {
        $punchCmd += "; `$env:ERP_CONNECTIONSTRINGS = '$centralConn'"
    }
    $punchCmd += "; go run ./cmd/server"
    Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", $punchCmd) | Out-Null
    Start-Sleep -Seconds 2
}

$importDir = Join-Path $BackendRoot "Services\ImportExportService"
if (Test-Path (Join-Path $importDir "go.mod")) {
    Write-Host "Starting ImportExportService (Go) on port 8060..."
    $importCmd = "cd `"$importDir`"; go run ./cmd/api"
    Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", $importCmd) | Out-Null
    Start-Sleep -Seconds 2
}

$hostProj = Join-Path $BackendRoot "Platform.Host\EnterpriseERP.Platform.Host.csproj"
Write-Host "Starting Platform.Host on port 5000..."
Start-Process -FilePath "powershell" -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd `"$BackendRoot`"; dotnet run --project `"$hostProj`" --no-build"
) | Out-Null

Set-Location $FrontendDir
Write-Host "==> Starting Frontend (yarn start) on port 3000..."
yarn start
if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend failed to start (exit code $LASTEXITCODE)."
}
