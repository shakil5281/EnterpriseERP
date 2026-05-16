namespace MerchandisingService.Contracts;

public abstract record IntegrationEvent(string EventName, Guid CompanyId)
{
    public Guid EventId { get; init; } = Guid.NewGuid();
    public DateTime OccurredAtUtc { get; init; } = DateTime.UtcNow;
}

public sealed record BuyerCreated(Guid CompanyId, Guid BuyerId, string BuyerCode, string BuyerName) : IntegrationEvent(nameof(BuyerCreated), CompanyId);
public sealed record StyleCreated(Guid CompanyId, Guid StyleId, Guid BuyerId, string StyleNo) : IntegrationEvent(nameof(StyleCreated), CompanyId);
public sealed record OrderConfirmed(Guid CompanyId, Guid OrderId, Guid BuyerId, Guid StyleId, string OrderNo, int TotalOrderQty, DateOnly? ShipmentDate) : IntegrationEvent(nameof(OrderConfirmed), CompanyId);
public sealed record OrderCancelled(Guid CompanyId, Guid OrderId, string OrderNo) : IntegrationEvent(nameof(OrderCancelled), CompanyId);
public sealed record BomCreated(Guid CompanyId, Guid OrderId, int TotalRequiredItems) : IntegrationEvent(nameof(BomCreated), CompanyId);
public sealed record CostingCreated(Guid CompanyId, Guid OrderId, Guid CostingId, decimal TotalCost, decimal SellingPrice) : IntegrationEvent(nameof(CostingCreated), CompanyId);
public sealed record SampleApproved(Guid CompanyId, Guid SampleId, Guid StyleId) : IntegrationEvent(nameof(SampleApproved), CompanyId);
public sealed record ShipmentPlanCreated(Guid CompanyId, Guid ShipmentPlanId, Guid OrderId, int PlannedQty) : IntegrationEvent(nameof(ShipmentPlanCreated), CompanyId);

public sealed record CuttingStarted(Guid CompanyId, Guid OrderId);
public sealed record ProductionStarted(Guid CompanyId, Guid OrderId);
public sealed record ProductionCompleted(Guid CompanyId, Guid OrderId);
public sealed record ShipmentCompleted(Guid CompanyId, Guid OrderId, int ShippedQty);
public sealed record StockReceived(Guid CompanyId, Guid ItemId, decimal Quantity);
public sealed record PurchaseOrderCreated(Guid CompanyId, Guid OrderId, Guid PurchaseOrderId);
