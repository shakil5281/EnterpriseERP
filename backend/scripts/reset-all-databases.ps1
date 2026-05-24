# Reset all ERP SQL Server databases and re-apply EF Core migrations.
# Uses backend/Configuration/connectionstrings.json (via each API's AddEnterpriseErpConnectionConfiguration).
# Requires: dotnet ef, sqlcmd, SQL Server at unity3\SQLEXPRESS (see $SqlServer below).

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Backend = $Root

$SqlServer = "unity3\SQLEXPRESS"
$SqlUser = "sa"
$SqlPassword = "123580"

$Databases = @(
    "AuthServiceDB",
    "CompanyServiceDB",
    "HRServiceDB",
    "AttendanceServiceDB",
    "LeaveServiceDB",
    "ShiftServiceDB",
    "PayrollServiceDB",
    "NotificationServiceDB",
    "PunchDataDB",
    "ImportExportDB",
    "QualityServiceDB",
    "FinishingServiceDB",
    "SecurityServiceDB",
    "AccountsServiceDB",
    "CuttingServiceDB",
    "MerchandisingServiceDB",
    "ProcurementServiceDB",
    "InventoryServiceDB"
)

$EfServices = @(
    @{ Name = "Auth";        Api = "Services\AuthService\AuthService.Api";        Project = "Services\AuthService\AuthService.Infrastructure";        Context = "AuthDbContext" },
    @{ Name = "Company";     Api = "Services\CompanyService\CompanyService.Api";     Project = "Services\CompanyService\CompanyService.Infrastructure";     Context = "CompanyDbContext" },
    @{ Name = "HR";          Api = "Services\HRService\HRService.Api";               Project = "Services\HRService\HRService.Infrastructure";               Context = "HrDbContext" },
    @{ Name = "Attendance";  Api = "Services\AttendanceService\AttendanceService.Api"; Project = "Services\AttendanceService\AttendanceService.Infrastructure"; Context = "AttendanceDbContext" },
    @{ Name = "Leave";       Api = "Services\LeaveService\LeaveService.Api";         Project = "Services\LeaveService\LeaveService.Infrastructure";         Context = "LeaveDbContext" },
    @{ Name = "Shift";       Api = "Services\ShiftService\ShiftService.Api";         Project = "Services\ShiftService\ShiftService.Infrastructure";         Context = "ShiftDbContext" },
    @{ Name = "Payroll";     Api = "Services\PayrollService\PayrollService.Api";     Project = "Services\PayrollService\PayrollService.Infrastructure";     Context = "PayrollDbContext" },
    @{ Name = "Notification"; Api = "Services\NotificationService\NotificationService.Api"; Project = "Services\NotificationService\NotificationService.Infrastructure"; Context = "NotificationDbContext" },
    @{ Name = "Quality";     Api = "Services\QualityService\QualityService.API";     Project = "Services\QualityService\QualityService.Infrastructure";     Context = "QualityDbContext" },
    @{ Name = "Finishing";   Api = "Services\FinishingService\FinishingService.API";   Project = "Services\FinishingService\FinishingService.Infrastructure";   Context = "FinishingDbContext" },
    @{ Name = "Security";    Api = "Services\SecurityService\SecurityService.API";    Project = "Services\SecurityService\SecurityService.Infrastructure";    Context = "SecurityDbContext" },
    @{ Name = "Accounts";    Api = "Services\AccountsService\AccountsService.API";    Project = "Services\AccountsService\AccountsService.Infrastructure";    Context = "AccountsDbContext" },
    @{ Name = "Cutting";     Api = "Services\CuttingService\CuttingService.API";     Project = "Services\CuttingService\CuttingService.Infrastructure";     Context = "CuttingDbContext" },
    @{ Name = "Merchandising"; Api = "Services\MerchandisingService\MerchandisingService.API"; Project = "Services\MerchandisingService\MerchandisingService.Infrastructure"; Context = "MerchandisingDbContext" },
    @{ Name = "Procurement"; Api = "Services\ProcurementService\ProcurementService.API"; Project = "Services\ProcurementService\ProcurementService.Infrastructure"; Context = "ProcurementDbContext" },
    @{ Name = "Inventory"; Api = "Services\InventoryService\InventoryService.API"; Project = "Services\InventoryService\InventoryService.Infrastructure"; Context = "InventoryDbContext" }
)

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

Write-Step "Stopping running ERP API / host processes"
Get-Process -ErrorAction SilentlyContinue | Where-Object {
    $_.ProcessName -match 'AuthService|AttendanceService|HRService|CompanyService|Platform\.Host|EnterpriseERP|PunchData|ImportExport|CuttingService|FinishingService|QualityService|SecurityService|AccountsService|MerchandisingService|ProcurementService|InventoryService|LeaveService|ShiftService|PayrollService|NotificationService'
} | ForEach-Object {
    Write-Host "  Stopping $($_.ProcessName) ($($_.Id))"
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2

Write-Step "Dropping databases on $SqlServer"
foreach ($db in $Databases) {
    $sql = @"
IF DB_ID(N'$db') IS NOT NULL
BEGIN
    ALTER DATABASE [$db] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [$db];
    PRINT 'Dropped $db';
END
ELSE
    PRINT 'Skip (not found): $db';
"@
    sqlcmd -C -S $SqlServer -U $SqlUser -P $SqlPassword -Q $sql 2>&1 | ForEach-Object { Write-Host "  $_" }
}

Write-Step "Creating empty databases"
foreach ($db in $Databases) {
    sqlcmd -C -S $SqlServer -U $SqlUser -P $SqlPassword -Q "IF DB_ID(N'$db') IS NULL CREATE DATABASE [$db];" 2>&1 | Out-Null
    Write-Host "  $db"
}

Write-Step "Applying EF Core migrations"
foreach ($svc in $EfServices) {
    $apiPath = Join-Path $Backend $svc.Api
    $projPath = Join-Path $Backend $svc.Project
    $projFile = Get-ChildItem -Path $projPath -Filter "*.csproj" | Select-Object -First 1
    $apiFile = Get-ChildItem -Path $apiPath -Filter "*.csproj" | Select-Object -First 1
    if (-not $projFile -or -not $apiFile) {
        Write-Warning "Skip $($svc.Name): project not found"
        continue
    }
    Write-Host "  $($svc.Name) ($($svc.Context))..." -ForegroundColor Yellow
    Push-Location $apiPath
    try {
        dotnet ef database update --project $projFile.FullName --context $svc.Context 2>&1 | ForEach-Object { Write-Host "    $_" }
        if ($LASTEXITCODE -ne 0) { throw "dotnet ef failed for $($svc.Name)" }
    }
    finally {
        Pop-Location
    }
}

Write-Step "Go services: create schema (GORM AutoMigrate)"
$goJwt = "dev_signing_key_at_least_32_chars_long_for_erp_local"
$connJson = Join-Path $Backend "Configuration\connectionstrings.json"

function Invoke-GoMigrate($serviceDir, $envPrefix) {
    $dir = Join-Path $Backend $serviceDir
    if (-not (Test-Path $dir)) { return }
    Write-Host "  $serviceDir..." -ForegroundColor Yellow
    Push-Location $dir
    try {
        $job = Start-Job -ScriptBlock {
            param($d, $jwt)
            Set-Location $d
            $env:PUNCHDATA_JWT_SIGNINGKEY = $jwt
            $env:PUNCHDATA_CONNECTIONSTRING = "Server=unity3\SQLEXPRESS;Database=PunchDataDB;User Id=sa;Password=123580;Encrypt=Mandatory;TrustServerCertificate=True;MultipleActiveResultSets=true"
            & go run ./cmd/server 2>&1
        } -ArgumentList $dir, $goJwt
        Wait-Job $job -Timeout 45 | Out-Null
        Stop-Job $job -ErrorAction SilentlyContinue
        Remove-Job $job -Force -ErrorAction SilentlyContinue
    }
    finally { Pop-Location }
}

# PunchData uses cmd/server; ImportExport uses cmd/api
Invoke-GoMigrate "Services\PunchDataService" "PUNCHDATA"
Push-Location (Join-Path $Backend "Services\ImportExportService")
try {
    $job = Start-Job -ScriptBlock {
        param($d, $jwt)
        Set-Location $d
        $env:IMPORTEXPORT_JWT_SIGNINGKEY = $jwt
        $env:IMPORTEXPORT_CONNECTIONSTRING = "Server=unity3\SQLEXPRESS;Database=ImportExportDB;User Id=sa;Password=123580;Encrypt=Mandatory;TrustServerCertificate=True;MultipleActiveResultSets=true"
        $env:IMPORTEXPORT_COMPANY_CONNECTIONSTRING = "Server=unity3\SQLEXPRESS;Database=CompanyServiceDB;User Id=sa;Password=123580;Encrypt=Mandatory;TrustServerCertificate=True;MultipleActiveResultSets=true"
        & go run ./cmd/api 2>&1
    } -ArgumentList (Get-Location).Path, $goJwt
    Wait-Job $job -Timeout 45 | Out-Null
    Stop-Job $job -ErrorAction SilentlyContinue
    Remove-Job $job -Force -ErrorAction SilentlyContinue
}
finally { Pop-Location }

Write-Step "Optional: seed Auth + sample Company/HR via Platform.Host"
Write-Host "  dotnet run --project Platform.Host\EnterpriseERP.Platform.Host.csproj"
Write-Host "  (creates default company, EMP-0001 sample employee, admin user via AuthDataSeeder)"

Write-Step "Done. All databases dropped and migrations reapplied."
