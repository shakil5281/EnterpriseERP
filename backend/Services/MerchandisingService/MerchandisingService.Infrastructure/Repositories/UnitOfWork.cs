using MerchandisingService.Application;
using MerchandisingService.Domain;
using MerchandisingService.Infrastructure.Persistence;

namespace MerchandisingService.Infrastructure.Repositories;

public sealed class UnitOfWork(MerchandisingDbContext db) : IUnitOfWork
{
    public IRepository<Buyer> Buyers { get; } = new EfRepository<Buyer>(db);
    public IRepository<Season> Seasons { get; } = new EfRepository<Season>(db);
    public IRepository<GarmentItem> GarmentItems { get; } = new EfRepository<GarmentItem>(db);
    public IRepository<Style> Styles { get; } = new EfRepository<Style>(db);
    public IRepository<Order> Orders { get; } = new EfRepository<Order>(db);
    public IRepository<BuyerPurchaseOrder> BuyerPurchaseOrders { get; } = new EfRepository<BuyerPurchaseOrder>(db);
    public IRepository<OrderColorSizeBreakdown> Breakdowns { get; } = new EfRepository<OrderColorSizeBreakdown>(db);
    public IRepository<BomItem> BomItems { get; } = new EfRepository<BomItem>(db);
    public IRepository<OrderCosting> Costings { get; } = new EfRepository<OrderCosting>(db);
    public IRepository<Sample> Samples { get; } = new EfRepository<Sample>(db);
    public IRepository<ShipmentPlan> ShipmentPlans { get; } = new EfRepository<ShipmentPlan>(db);

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
