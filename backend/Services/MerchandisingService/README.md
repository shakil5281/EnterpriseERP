# MerchandisingService

Production-ready ASP.NET Core `net10.0` Web API for garments/textile ERP merchandising workflows.

## Architecture

```text
MerchandisingService
|-- MerchandisingService.API
|-- MerchandisingService.Application
|-- MerchandisingService.Contracts
|-- MerchandisingService.Domain
|-- MerchandisingService.Infrastructure
`-- MerchandisingService.Tests
```

The service uses Clean Architecture, CQRS with MediatR, EF Core, SQL Server 2022, repository/unit of work, FluentValidation, AutoMapper, JWT role-based authorization, Redis cache abstraction, RabbitMQ integration-event abstraction, Swagger, global exception handling, audit logs, status history, seed data, and tests.

## Run

```powershell
dotnet restore Services\MerchandisingService\MerchandisingService.slnx
dotnet ef database update --project Services\MerchandisingService\MerchandisingService.Infrastructure --startup-project Services\MerchandisingService\MerchandisingService.API --context MerchandisingDbContext
dotnet run --project Services\MerchandisingService\MerchandisingService.API
```

Swagger is available at `/swagger`. Health is available at `/health`.

## Platform integration

For local development with hrhub, run **Platform.Host** on port **5000** (auth + YARP proxy) and **MerchandisingService** on port **5288**:

```bash
dotnet run --project Platform.Host/EnterpriseERP.Platform.Host.csproj
dotnet run --project Services/MerchandisingService/MerchandisingService.API
```

Platform.Host proxies `/api/v1/merchandising/*` → `http://127.0.0.1:5288/`. hrhub uses `NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1`.

Optional satellite services (proxied from Platform.Host):

| Service | Port | Path |
|---------|------|------|
| MerchandisingService | 5288 | `/api/v1/merchandising/*` |
| ProcurementService | 5060 | `/api/v1/procurement/*` |
| InventoryService | 5041 | `/api/v1/inventory/*` |

Apply migrations before first run:

```bash
dotnet ef database update --project Services/MerchandisingService/MerchandisingService.Infrastructure \
  --startup-project Services/MerchandisingService/MerchandisingService.API --context MerchandisingDbContext
```

## Configuration

`MerchandisingService.API/appsettings.json` contains:

```json
{
  "ConnectionStrings": {
    "MerchandisingDb": "Server=localhost;Database=EnterpriseERP_Merchandising;Trusted_Connection=True;TrustServerCertificate=True",
    "Redis": "localhost:6379"
  },
  "Jwt": {
    "SigningKey": "dev_signing_key_at_least_32_chars_long",
    "Issuer": "erp_auth_service",
    "Audience": "erp_platform"
  },
  "RabbitMQ": {
    "Exchange": "erp.merchandising"
  }
}
```

## Key Business Rules

- Buyer code is unique per company.
- Style number is unique per buyer.
- Order number is unique per company.
- Orders cannot be confirmed without color-size breakdown.
- Color-size breakdown total must match order quantity before confirmation.
- BOM required quantity includes wastage.
- Shipment plan quantity cannot exceed remaining order quantity.
- Order status changes are stored in `OrderStatusHistories`.
- Business-table writes produce `MerchandisingAuditLogs`.
- Confirmation publishes `OrderConfirmed`; BOM creation publishes `BOMCreated`.

## Main Endpoints

- `POST /api/buyers`
- `GET /api/buyers?companyId={companyId}`
- `POST /api/styles`
- `GET /api/styles?companyId={companyId}&buyerId={buyerId}`
- `POST /api/orders`
- `PATCH /api/orders/{id}/confirm`
- `PATCH /api/orders/{id}/cancel`
- `POST /api/orders/{orderId}/buyer-pos`
- `POST /api/orders/{orderId}/color-size-breakdown`
- `POST /api/orders/{orderId}/bom-items`
- `POST /api/orders/{orderId}/bom-calculate`
- `POST /api/orders/{orderId}/costing`
- `POST /api/samples`
- `PATCH /api/samples/{id}/approve`
- `POST /api/shipment-plans`
- `GET /api/reports/order-summary.csv?companyId={companyId}`

## Example Requests

Create buyer:

```json
{
  "companyId": "20000000-0000-0000-0000-000000000001",
  "buyerCode": "ZARA",
  "buyerName": "Zara",
  "country": "Spain",
  "contactPerson": "Maria Lopez",
  "email": "maria@example.com",
  "phone": "+34-000-000",
  "address": "Arteixo, Spain"
}
```

Create order:

```json
{
  "companyId": "20000000-0000-0000-0000-000000000001",
  "buyerId": "30000000-0000-0000-0000-000000000001",
  "styleId": "33000000-0000-0000-0000-000000000001",
  "orderNo": "ORD-001",
  "orderDate": "2026-05-16",
  "shipmentDate": "2026-07-30",
  "totalOrderQty": 50000,
  "unitPrice": 4.25,
  "currencyCode": "USD"
}
```

Create color-size breakdown:

```json
{
  "companyId": "20000000-0000-0000-0000-000000000001",
  "buyerPurchaseOrderId": null,
  "colorName": "Black",
  "sizeName": "M",
  "quantity": 50000
}
```

Create BOM item:

```json
{
  "companyId": "20000000-0000-0000-0000-000000000001",
  "itemType": "Fabric",
  "itemCode": "FAB-SJ-160",
  "itemName": "160 GSM Single Jersey",
  "unitName": "Kg",
  "consumption": 0.18,
  "wastagePercent": 3,
  "unitPrice": 5.2
}
```

Example response:

```json
{
  "success": true,
  "message": "BOM item created.",
  "data": {
    "id": "5cc9ee46-43f7-4f43-b7a4-86c5c7538d41",
    "companyId": "20000000-0000-0000-0000-000000000001",
    "orderId": "e38bde64-ec95-43fb-bab9-8d7ac6933c70",
    "itemType": "Fabric",
    "itemCode": "FAB-SJ-160",
    "itemName": "160 GSM Single Jersey",
    "unitName": "Kg",
    "consumption": 0.18,
    "wastagePercent": 3,
    "requiredQty": 9270,
    "unitPrice": 5.2,
    "totalCost": 48204
  },
  "errors": null
}
```

## Tests

```powershell
dotnet test Services\MerchandisingService\MerchandisingService.Tests\MerchandisingService.Tests.csproj
```

