#!/bin/bash
set -e

# Reset all ERP SQL Server databases and re-apply EF Core migrations.
# Uses backend/Configuration/connectionstrings.json
# Requires: dotnet ef, sqlcmd, go

echo "==> Stopping running ERP API / host processes"
pkill -f "AuthService|AttendanceService|HRService|CompanyService|Platform.Host|EnterpriseERP|PunchData|ImportExport|CuttingService|FinishingService|QualityService|SecurityService|AccountsService|MerchandisingService|LeaveService|ShiftService|PayrollService|NotificationService" || true
sleep 2

SQL_SERVER="localhost"
SQL_USER="sa"
SQL_PASSWORD="shakil52814542A"

DATABASES=(
    "AuthServiceDB"
    "CompanyServiceDB"
    "HRServiceDB"
    "AttendanceServiceDB"
    "LeaveServiceDB"
    "ShiftServiceDB"
    "PayrollServiceDB"
    "NotificationServiceDB"
    "PunchDataDB"
    "ImportExportDB"
    "QualityServiceDB"
    "FinishingServiceDB"
    "SecurityServiceDB"
    "AccountsServiceDB"
    "CuttingServiceDB"
    "MerchandisingServiceDB"
)

echo "==> Dropping databases on $SQL_SERVER"
for db in "${DATABASES[@]}"; do
    sql="IF DB_ID(N'$db') IS NOT NULL BEGIN ALTER DATABASE [$db] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [$db]; PRINT 'Dropped $db'; END ELSE PRINT 'Skip (not found): $db';"
    sqlcmd -C -S "$SQL_SERVER" -U "$SQL_USER" -P "$SQL_PASSWORD" -Q "$sql" || true
done

echo "==> Creating empty databases"
for db in "${DATABASES[@]}"; do
    sqlcmd -C -S "$SQL_SERVER" -U "$SQL_USER" -P "$SQL_PASSWORD" -Q "IF DB_ID(N'$db') IS NULL CREATE DATABASE [$db];" > /dev/null 2>&1 || true
    echo "  $db"
done

echo "==> Applying EF Core migrations"

declare -A EF_SERVICES=(
    ["Auth"]="Services/AuthService/AuthService.Api Services/AuthService/AuthService.Infrastructure AuthDbContext"
    ["Company"]="Services/CompanyService/CompanyService.Api Services/CompanyService/CompanyService.Infrastructure CompanyDbContext"
    ["HR"]="Services/HRService/HRService.Api Services/HRService/HRService.Infrastructure HrDbContext"
    ["Attendance"]="Services/AttendanceService/AttendanceService.Api Services/AttendanceService/AttendanceService.Infrastructure AttendanceDbContext"
    ["Leave"]="Services/LeaveService/LeaveService.Api Services/LeaveService/LeaveService.Infrastructure LeaveDbContext"
    ["Shift"]="Services/ShiftService/ShiftService.Api Services/ShiftService/ShiftService.Infrastructure ShiftDbContext"
    ["Payroll"]="Services/PayrollService/PayrollService.Api Services/PayrollService/PayrollService.Infrastructure PayrollDbContext"
    ["Notification"]="Services/NotificationService/NotificationService.Api Services/NotificationService/NotificationService.Infrastructure NotificationDbContext"
    ["Quality"]="Services/QualityService/QualityService.API Services/QualityService/QualityService.Infrastructure QualityDbContext"
    ["Finishing"]="Services/FinishingService/FinishingService.API Services/FinishingService/FinishingService.Infrastructure FinishingDbContext"
    ["Security"]="Services/SecurityService/SecurityService.API Services/SecurityService/SecurityService.Infrastructure SecurityDbContext"
    ["Accounts"]="Services/AccountsService/AccountsService.API Services/AccountsService/AccountsService.Infrastructure AccountsDbContext"
    ["Cutting"]="Services/CuttingService/CuttingService.API Services/CuttingService/CuttingService.Infrastructure CuttingDbContext"
    ["Merchandising"]="Services/MerchandisingService/MerchandisingService.API Services/MerchandisingService/MerchandisingService.Infrastructure MerchandisingDbContext"
)

# Because associative array order is random in bash, we'll use a fixed array of keys to maintain order
KEYS=("Auth" "Company" "HR" "Attendance" "Leave" "Shift" "Payroll" "Notification" "Quality" "Finishing" "Security" "Accounts" "Cutting" "Merchandising")

BACKEND_DIR="/home/shakil-hossain/Desktop/SHAKIL/EnterpriseERP/backend"

for name in "${KEYS[@]}"; do
    IFS=' ' read -r api proj context <<< "${EF_SERVICES[$name]}"
    api_path="$BACKEND_DIR/$api"
    proj_path="$BACKEND_DIR/$proj"
    
    proj_file=$(find "$proj_path" -maxdepth 1 -name "*.csproj" | head -n 1)
    if [ -z "$proj_file" ]; then
        echo "Skip $name: project not found"
        continue
    fi
    
    echo "  $name ($context)..."
    cd "$api_path"
    dotnet ef database update --project "$proj_file" --context "$context" || echo "dotnet ef failed for $name"
    cd "$BACKEND_DIR"
done

echo "==> Go services: create schema (GORM AutoMigrate)"
export GO_JWT="dev_signing_key_at_least_32_chars_long_for_erp_local"

echo "  PunchDataService..."
cd "$BACKEND_DIR/Services/PunchDataService" || true
if [ -f "go.mod" ]; then
    export PUNCHDATA_JWT_SIGNINGKEY="$GO_JWT"
    export PUNCHDATA_CONNECTIONSTRING="Server=$SQL_SERVER;Database=PunchDataDB;User Id=$SQL_USER;Password=$SQL_PASSWORD;Encrypt=Mandatory;TrustServerCertificate=True;MultipleActiveResultSets=true"
    timeout 15s go run ./cmd/server || true
fi

echo "  ImportExportService..."
cd "$BACKEND_DIR/Services/ImportExportService" || true
if [ -f "go.mod" ]; then
    export IMPORTEXPORT_JWT_SIGNINGKEY="$GO_JWT"
    export IMPORTEXPORT_CONNECTIONSTRING="Server=$SQL_SERVER;Database=ImportExportDB;User Id=$SQL_USER;Password=$SQL_PASSWORD;Encrypt=Mandatory;TrustServerCertificate=True;MultipleActiveResultSets=true"
    export IMPORTEXPORT_COMPANY_CONNECTIONSTRING="Server=$SQL_SERVER;Database=CompanyServiceDB;User Id=$SQL_USER;Password=$SQL_PASSWORD;Encrypt=Mandatory;TrustServerCertificate=True;MultipleActiveResultSets=true"
    timeout 15s go run ./cmd/api || true
fi

cd "$BACKEND_DIR"

echo "==> Optional: seed Auth + sample Company/HR via Platform.Host"
echo "  Running Platform.Host for 20 seconds to seed data..."
cd "$BACKEND_DIR/Platform.Host"
timeout 20s dotnet run --project EnterpriseERP.Platform.Host.csproj || true

echo "==> Done. All databases dropped and migrations reapplied."
