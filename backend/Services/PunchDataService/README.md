# PunchDataService

Go (Gin) microservice for collecting, downloading, and processing punch / attendance logs from biometric devices and upstream sources. The service is part of the EnterpriseERP platform and shares the same JWT identity issued by `AuthService`.

- Language: Go (`net/http` + Gin)
- Database: SQL Server (`PunchDataDB`)
- Port: `5050`
- Auth: HS256 JWT (Issuer `AuthService`, Audience `Erp.Platform`)
- Gateway route prefix: `/api/v1/punch-data`

## Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET    | `/health`                                  | Liveness + DB ping (no auth required) |
| POST   | `/api/v1/punch-data/logs/upload`           | Multipart file upload (`file`, optional `companyId`, `deviceId`, `autoProcess`). CSV or JSON. |
| POST   | `/api/v1/punch-data/logs/batch`            | JSON batch ingest (`{companyId, deviceId, source, records:[...]}`) |
| GET    | `/api/v1/punch-data/logs`                  | List uploaded log files (filters: `companyId`, `deviceId`, `status`, `page`, `pageSize`) |
| GET    | `/api/v1/punch-data/logs/:id`              | Single log file metadata |
| GET    | `/api/v1/punch-data/logs/:id/download`     | Stream the original raw payload back |
| GET    | `/api/v1/punch-data/logs/:id/records`      | Punches that came from a single log file |
| POST   | `/api/v1/punch-data/logs/:id/process`      | (Re-)process a single log file |
| POST   | `/api/v1/punch-data/process?limit=50`      | Process all `Pending` log files |
| GET    | `/api/v1/punch-data/punches`               | List processed punches (filters: `companyId`, `employeeCode`, `deviceId`, `direction`, `from`, `to`, `logFileId`, `page`, `pageSize`) |

All authenticated endpoints expect `Authorization: Bearer <token>` issued by `AuthService` at `http://localhost:5012/api/v1/auth/login`.

## Accepted payload formats

### CSV (file upload)

Header is case-insensitive; underscores are stripped. Required: `employeeCode`, `punchTime`. Optional: `deviceId`, `direction`, `source`, `companyId`.

```csv
employeeCode,deviceId,punchTime,direction,source
EMP-0001,DEV-01,2026-05-13T08:00:15Z,In,ZKTeco
EMP-0001,DEV-01,2026-05-13 17:02:40,Out,ZKTeco
```

### JSON (file upload or `/logs/batch`)

```json
{
  "companyId": 1,
  "deviceId": "DEV-01",
  "source": "ZKTeco",
  "records": [
    { "employeeCode": "EMP-0001", "punchTime": "2026-05-13T08:00:15Z", "direction": "In" },
    { "employeeCode": "EMP-0001", "punchTime": "2026-05-13T17:02:40Z", "direction": "Out" }
  ]
}
```

A bare array (`[ {...}, {...} ]`) is also accepted.

### Direction normalisation

`in`, `i`, `checkin`, `check-in`, `0` → `In`
`out`, `o`, `checkout`, `check-out`, `1` → `Out`
anything else / empty → `Unknown`

### Timestamps

Accepted formats: RFC3339, `2006-01-02T15:04:05`, `2006-01-02 15:04:05`, `02/01/2006 15:04:05`, `01/02/2006 15:04:05`, `2006/01/02 15:04:05`, unix seconds, unix milliseconds.

## Configuration

Reads `appsettings.json` and overlays `appsettings.<ASPNETCORE_ENVIRONMENT>.json` (defaults to `Development`). Environment overrides:

| Env var | Path |
| ------- | ---- |
| `PUNCHDATA_SERVER_ADDRESS`   | `Server.Address` (e.g. `:5050`) |
| `PUNCHDATA_CONNECTIONSTRING` | `ConnectionStrings.PunchDataDb` |
| `PUNCHDATA_JWT_SIGNINGKEY`   | `Jwt.SigningKey` |
| `PUNCHDATA_JWT_ISSUER`       | `Jwt.Issuer` |
| `PUNCHDATA_JWT_AUDIENCE`     | `Jwt.Audience` |

The SQL Server connection string accepts the standard ADO style (same shape as the other .NET service settings).

## Run locally

```powershell
cd Services/PunchDataService
go mod tidy
go run ./cmd/server
```

The service auto-migrates `PunchLogFiles` and `PunchRecords` on startup.

## Swagger UI

OpenAPI/Swagger 2.0 documentation is generated with [`swaggo/swag`](https://github.com/swaggo/swag) and served by the running service.

- Direct: `http://localhost:5050/swagger/index.html`
- Spec JSON: `http://localhost:5050/swagger/doc.json`
- Through the API Gateway: `http://localhost:5000/api/v1/punch-data/swagger/index.html`
- A request to `/` redirects to the swagger UI for convenience.

The Swagger spec lives in `internal/docs/` and is **generated** — regenerate it whenever you change a handler annotation:

```powershell
# Install the CLI once (puts swag.exe in $env:USERPROFILE\go\bin)
go install github.com/swaggo/swag/cmd/swag@latest

# Regenerate the spec
swag init -g cmd/server/main.go --output internal/docs --parseDependency --parseInternal --parseDepth 2
```

To call protected endpoints from the Swagger UI, click **Authorize** and paste the access token returned by `POST /api/v1/auth/login` on AuthService (e.g. `Bearer eyJhbGciOi...`).

## Docker

```powershell
docker build -t enterprise-erp/punchdata Services/PunchDataService
docker run --rm -p 5050:5050 \
  -e PUNCHDATA_CONNECTIONSTRING="Server=host.docker.internal,1433;Database=PunchDataDB;User Id=sa;Password=...;TrustServerCertificate=True" \
  -e PUNCHDATA_JWT_SIGNINGKEY="..." \
  enterprise-erp/punchdata
```
