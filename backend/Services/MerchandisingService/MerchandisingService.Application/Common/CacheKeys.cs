namespace MerchandisingService.Application.Common;

internal static class CacheKeys
{
    public static string Buyers(Guid companyId) => $"merch:buyers:{companyId}";
    public static string Styles(Guid companyId, Guid? buyerId) => $"merch:styles:{companyId}:{buyerId?.ToString() ?? "all"}";
    public static string OrderDetails(Guid orderId) => $"merch:order-details:{orderId}";
    public static string BomItems(Guid orderId) => $"merch:bom:{orderId}";
    public static string Costing(Guid orderId) => $"merch:costing:{orderId}";
}
