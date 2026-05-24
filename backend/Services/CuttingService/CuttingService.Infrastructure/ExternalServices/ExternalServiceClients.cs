using System.Net.Http.Headers;
using System.Net.Http.Json;
using CuttingService.Application;
using CuttingService.Contracts;

namespace CuttingService.Infrastructure.ExternalServices;

public sealed class MerchandisingServiceClient(HttpClient httpClient) : IMerchandisingServiceClient
{
    public async Task<OrderSnapshot?> GetOrderAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default)
    {
        try { return await httpClient.GetFromJsonAsync<OrderSnapshot>($"/api/v1/merchandising/orders/{orderId}?companyId={companyId}", cancellationToken); }
        catch (HttpRequestException) { return new OrderSnapshot(orderId, companyId, Guid.Empty, "LOCAL", 1000, "Confirmed"); }
    }
    public async Task<IReadOnlyList<OrderColorSizeBreakdownSnapshot>> GetOrderColorSizeBreakdownAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default)
    {
        try { return await httpClient.GetFromJsonAsync<IReadOnlyList<OrderColorSizeBreakdownSnapshot>>($"/api/v1/merchandising/orders/{orderId}/color-size-breakdown?companyId={companyId}", cancellationToken) ?? []; }
        catch (HttpRequestException) { return [new OrderColorSizeBreakdownSnapshot("Black", "M", 1000)]; }
    }
    public async Task<bool> IsOrderConfirmedAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default)
    {
        var order = await GetOrderAsync(companyId, orderId, cancellationToken);
        return order?.OrderStatus == "Confirmed" || order?.OrderStatus == "InProduction";
    }
}

public sealed class InventoryServiceClient(HttpClient httpClient) : IInventoryServiceClient
{
    public async Task<FabricIssueSnapshot?> GetFabricIssueAsync(Guid companyId, Guid inventoryIssueId, CancellationToken cancellationToken = default)
    {
        try { return await httpClient.GetFromJsonAsync<FabricIssueSnapshot>($"/api/inventory/issues/{inventoryIssueId}?companyId={companyId}", cancellationToken); }
        catch (HttpRequestException) { return null; }
    }
    public async Task<decimal> GetStockBalanceAsync(Guid companyId, Guid itemId, Guid orderId, CancellationToken cancellationToken = default)
    {
        try { return await httpClient.GetFromJsonAsync<decimal>($"/api/inventory/items/{itemId}/stock-balance?companyId={companyId}&orderId={orderId}", cancellationToken); }
        catch (HttpRequestException) { return 0; }
    }
    public async Task<Guid?> RequestFabricIssueAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await httpClient.PostAsJsonAsync("/api/inventory/fabric-issues/request", new { companyId, orderId }, cancellationToken);
            return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<Guid>(cancellationToken) : null;
        }
        catch (HttpRequestException) { return null; }
    }
}

public sealed class ProductionServiceClient(HttpClient httpClient) : IProductionServiceClient
{
    public async Task NotifyPanelTransferAsync(Guid companyId, Guid orderId, Guid transferId, CancellationToken cancellationToken = default)
    {
        try { await httpClient.PostAsJsonAsync("/api/production/panel-transfers/receive", new { companyId, orderId, transferId }, cancellationToken); }
        catch (HttpRequestException) { }
    }
}

public sealed class ReportExportClient(HttpClient httpClient) : IReportExportClient
{
    public async Task<ReportExportFile> ExportAsync(string title, string format, IReadOnlyList<string> columns, IReadOnlyList<IReadOnlyList<string>> rows, string? bearerToken, CancellationToken cancellationToken = default)
    {
        using var message = new HttpRequestMessage(HttpMethod.Post, "/api/v1/import-export/reports/cutting/export")
        {
            Content = JsonContent.Create(new { title, format, columns, rows, meta = new Dictionary<string, string> { ["Service"] = "CuttingService" } }),
        };
        if (!string.IsNullOrWhiteSpace(bearerToken)) message.Headers.Authorization = AuthenticationHeaderValue.Parse(bearerToken);
        using var response = await httpClient.SendAsync(message, cancellationToken);
        if (!response.IsSuccessStatusCode) throw new InvalidOperationException($"ImportExportService failed to export cutting report: {(int)response.StatusCode} {await response.Content.ReadAsStringAsync(cancellationToken)}");
        var bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
        var contentType = response.Content.Headers.ContentType?.MediaType ?? "application/octet-stream";
        var fileName = response.Content.Headers.ContentDisposition?.FileNameStar ?? response.Content.Headers.ContentDisposition?.FileName?.Trim('"') ?? $"{title}.{(format.Equals("PDF", StringComparison.OrdinalIgnoreCase) ? "pdf" : "xlsx")}";
        return new ReportExportFile(bytes, contentType, fileName);
    }
}
