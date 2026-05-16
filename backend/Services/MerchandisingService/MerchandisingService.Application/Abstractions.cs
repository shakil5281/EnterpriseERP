using MerchandisingService.Contracts;
using MerchandisingService.Domain;

namespace MerchandisingService.Application;

public interface IMerchandisingDbContext
{
    IQueryable<Buyer> Buyers { get; }
    IQueryable<Season> Seasons { get; }
    IQueryable<GarmentItem> GarmentItems { get; }
    IQueryable<Style> Styles { get; }
    IQueryable<Order> Orders { get; }
    IQueryable<BuyerPurchaseOrder> BuyerPurchaseOrders { get; }
    IQueryable<OrderColorSizeBreakdown> OrderColorSizeBreakdowns { get; }
    IQueryable<BomItem> BomItems { get; }
    IQueryable<OrderCosting> OrderCostings { get; }
    IQueryable<Sample> Samples { get; }
    IQueryable<ShipmentPlan> ShipmentPlans { get; }
    IQueryable<OrderStatusHistory> OrderStatusHistories { get; }
    IQueryable<MerchandisingAuditLog> AuditLogs { get; }
    void Add<TEntity>(TEntity entity) where TEntity : class;
    void Remove<TEntity>(TEntity entity) where TEntity : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IRepository<TEntity> where TEntity : class
{
    IQueryable<TEntity> Query();
    Task<TEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(TEntity entity, CancellationToken cancellationToken = default);
    void Remove(TEntity entity);
}

public interface IUnitOfWork
{
    IRepository<Buyer> Buyers { get; }
    IRepository<Season> Seasons { get; }
    IRepository<GarmentItem> GarmentItems { get; }
    IRepository<Style> Styles { get; }
    IRepository<Order> Orders { get; }
    IRepository<BuyerPurchaseOrder> BuyerPurchaseOrders { get; }
    IRepository<OrderColorSizeBreakdown> Breakdowns { get; }
    IRepository<BomItem> BomItems { get; }
    IRepository<OrderCosting> Costings { get; }
    IRepository<Sample> Samples { get; }
    IRepository<ShipmentPlan> ShipmentPlans { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IRedisCacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);
    Task SetAsync<T>(string key, T value, TimeSpan expiration, CancellationToken cancellationToken = default);
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
}

public interface IIntegrationEventPublisher
{
    Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default) where TEvent : IntegrationEvent;
}

public interface IBomCalculationService
{
    BomItem Calculate(BomItem item, int orderQuantity);
    BomCalculationResultDto Summarize(Guid orderId, IReadOnlyCollection<BomItem> items);
}

public interface ICostingCalculationService
{
    OrderCosting Calculate(OrderCosting costing);
}

public interface ICompanyServiceClient
{
    Task<CompanySnapshot?> GetCompanyAsync(Guid companyId, CancellationToken cancellationToken = default);
}

public interface IInventoryServiceClient
{
    Task<bool> CheckItemExistsAsync(Guid companyId, Guid itemId, CancellationToken cancellationToken = default);
    Task<decimal> GetStockBalanceAsync(Guid companyId, Guid itemId, CancellationToken cancellationToken = default);
}

public interface IProcurementServiceClient
{
    Task<Guid?> CreatePurchaseRequisitionFromBomAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default);
}

public interface IProductionServiceClient
{
    Task<string?> GetOrderProductionStatusAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default);
}

public interface IShipmentServiceClient
{
    Task<string?> GetShipmentStatusAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default);
}

public sealed record CompanySnapshot(Guid CompanyId, string CompanyCode, string CompanyName);
