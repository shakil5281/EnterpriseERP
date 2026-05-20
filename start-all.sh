#!/bin/bash
set -e

# Start Enterprise ERP Full Project (Backend + Frontend)
# Usage: bash start-all.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Stopping existing processes..."
if command -v lsof >/dev/null 2>&1; then
    lsof -ti:5000 | xargs -r kill -9 || true # Platform.Host
    lsof -ti:5050 | xargs -r kill -9 || true # PunchDataService
    lsof -ti:3000 | xargs -r kill -9 || true # Frontend (Next.js)
else
    pkill -f "Platform.Host" || true
    pkill -f "PunchDataService" || true
    pkill -f "next" || true
fi

echo "==> Building Backend..."
cd "$ROOT_DIR/backend"
dotnet build EnterpriseERP.slnx

echo "==> Starting Backend Services in background..."
# Start Go Service
punch_dir="$ROOT_DIR/backend/Services/PunchDataService"
if [ -f "$punch_dir/go.mod" ]; then
    echo "Starting PunchDataService (Go) on port 5050..."
    (cd "$punch_dir" && go run ./cmd/server &)
fi

# Start C# Platform Host
host_proj="$ROOT_DIR/backend/Platform.Host/EnterpriseERP.Platform.Host.csproj"
echo "Starting Platform.Host on port 5000..."
dotnet run --project "$host_proj" --no-build &

echo "==> Starting Frontend..."
cd "$ROOT_DIR/hrhub"
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    yarn install
fi

echo "Starting Next.js frontend on port 3000..."
yarn dev
