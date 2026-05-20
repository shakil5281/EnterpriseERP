#!/bin/bash
set -e

# Start Enterprise ERP backend on a single port (5000)
# Usage: bash backend/scripts/start-platform.sh

BACKEND_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SLN="$BACKEND_ROOT/EnterpriseERP.slnx"

if [ ! -f "$SLN" ]; then
    echo "Could not find EnterpriseERP.slnx at $SLN"
    exit 1
fi

echo "Stopping existing process on port 5000 (Platform.Host)..."
if command -v lsof >/dev/null 2>&1; then
    lsof -ti:5000 | xargs -r kill -9 || true
else
    pkill -f "Platform.Host" || true
fi

echo "Stopping existing Go process on port 5050 (PunchDataService)..."
if command -v lsof >/dev/null 2>&1; then
    lsof -ti:5050 | xargs -r kill -9 || true
else
    pkill -f "PunchDataService" || true
fi

echo "Building EnterpriseERP.slnx..."
cd "$BACKEND_ROOT"
dotnet build "$SLN"

echo "Starting PunchDataService (Go) -- http://127.0.0.1:5050 ..."
punch_dir="$BACKEND_ROOT/Services/PunchDataService"
if [ -f "$punch_dir/go.mod" ]; then
    (cd "$punch_dir" && go run ./cmd/server &)
fi

host_proj="$BACKEND_ROOT/Platform.Host/EnterpriseERP.Platform.Host.csproj"
echo "Starting Platform.Host -- http://127.0.0.1:5000 ..."
dotnet run --project "$host_proj" --no-build
