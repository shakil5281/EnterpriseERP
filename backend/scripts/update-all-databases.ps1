# Apply pending EF Core migrations only (does NOT drop databases or delete data).
# Usage: powershell -ExecutionPolicy Bypass -File backend\scripts\update-all-databases.ps1

$ErrorActionPreference = "Stop"
$BackendRoot = Split-Path -Parent $PSScriptRoot
$CentralConn = Join-Path $BackendRoot "Configuration\connectionstrings.json"

if (-not (Test-Path $CentralConn)) {
    Write-Error "Missing $CentralConn"
}

$env:ERP_CONNECTIONSTRINGS = $CentralConn
Write-Host "==> Using connection strings: $CentralConn"
Write-Host "==> Applying EF Core migrations (update only - existing data is preserved)"
Write-Host ""

$services = @(
    @{ Name = "Auth";         Api = "Services\AuthService\AuthService.Api";         Proj = "Services\AuthService\AuthService.Infrastructure";         Context = "AuthDbContext" },
    @{ Name = "Company";      Api = "Services\CompanyService\CompanyService.Api";      Proj = "Services\CompanyService\CompanyService.Infrastructure";      Context = "CompanyDbContext" },
    @{ Name = "HR";           Api = "Services\HRService\HRService.Api";           Proj = "Services\HRService\HRService.Infrastructure";           Context = "HrDbContext" },
    @{ Name = "Attendance";   Api = "Services\AttendanceService\AttendanceService.Api";   Proj = "Services\AttendanceService\AttendanceService.Infrastructure";   Context = "AttendanceDbContext" },
    @{ Name = "Leave";        Api = "Services\LeaveService\LeaveService.Api";        Proj = "Services\LeaveService\LeaveService.Infrastructure";        Context = "LeaveDbContext" },
    @{ Name = "Shift";        Api = "Services\ShiftService\ShiftService.Api";        Proj = "Services\ShiftService\ShiftService.Infrastructure";        Context = "ShiftDbContext" },
    @{ Name = "Payroll";      Api = "Services\PayrollService\PayrollService.Api";      Proj = "Services\PayrollService\PayrollService.Infrastructure";      Context = "PayrollDbContext" },
    @{ Name = "Notification"; Api = "Services\NotificationService\NotificationService.Api"; Proj = "Services\NotificationService\NotificationService.Infrastructure"; Context = "NotificationDbContext" },
    @{ Name = "Quality";      Api = "Services\QualityService\QualityService.API";      Proj = "Services\QualityService\QualityService.Infrastructure";      Context = "QualityDbContext" },
    @{ Name = "Finishing";    Api = "Services\FinishingService\FinishingService.API";    Proj = "Services\FinishingService\FinishingService.Infrastructure";    Context = "FinishingDbContext" },
    @{ Name = "Security";     Api = "Services\SecurityService\SecurityService.API";     Proj = "Services\SecurityService\SecurityService.Infrastructure";     Context = "SecurityDbContext" },
    @{ Name = "Accounts";     Api = "Services\AccountsService\AccountsService.API";     Proj = "Services\AccountsService\AccountsService.Infrastructure";     Context = "AccountsDbContext" },
    @{ Name = "Cutting";      Api = "Services\CuttingService\CuttingService.API";      Proj = "Services\CuttingService\CuttingService.Infrastructure";      Context = "CuttingDbContext" },
    @{ Name = "Merchandising"; Api = "Services\MerchandisingService\MerchandisingService.API"; Proj = "Services\MerchandisingService\MerchandisingService.Infrastructure"; Context = "MerchandisingDbContext" }
)

Set-Location $BackendRoot
$failed = @()

foreach ($svc in $services) {
    $apiPath = Join-Path $BackendRoot $svc.Api
    $projPath = Join-Path $BackendRoot $svc.Proj
    $projFile = Get-ChildItem -Path $projPath -Filter "*.csproj" -File | Select-Object -First 1

    if (-not $projFile) {
        Write-Warning "Skip $($svc.Name): project not found under $projPath"
        continue
    }

    Write-Host "  $($svc.Name) ($($svc.Context))..."
    Push-Location $apiPath
    try {
        dotnet ef database update --project $projFile.FullName --context $svc.Context
        if ($LASTEXITCODE -ne 0) { $failed += $svc.Name }
    } catch {
        $failed += $svc.Name
        Write-Warning "  $($svc.Name) failed: $_"
    } finally {
        Pop-Location
    }
}

Write-Host ""
if ($failed.Count -gt 0) {
    Write-Warning "Some services reported errors: $($failed -join ', '). Platform.Host startup will retry MigrateAsync for core DBs."
} else {
    Write-Host "==> All EF migrations applied successfully."
}
Write-Host "==> Done. No database was dropped; only pending schema changes were applied."
