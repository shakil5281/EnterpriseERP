using Erp.BuildingBlocks.SharedKernel;
using MediatR;
using InventoryService.Contracts;
using InventoryService.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace InventoryService.Application;

public interface IInventoryDbContext
{
    IQueryable<StockItem> StockItems { get; }
    IQueryable<StockTransaction> StockTransactions { get; }
    void Add<T>(T entity) where T : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public sealed record ReceiveStockCommand(ReceiveStockRequest Request) : IRequest<StockItemDto>;
public sealed record IssueStockCommand(Guid ItemId, IssueStockRequest Request) : IRequest<StockItemDto>;

public sealed class InventoryHandlers(IInventoryDbContext db) :
    IRequestHandler<ReceiveStockCommand, StockItemDto>,
    IRequestHandler<IssueStockCommand, StockItemDto>
{
    public async Task<StockItemDto> Handle(ReceiveStockCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var item = await db.StockItems.FirstOrDefaultAsync(x => x.CompanyId == r.CompanyId && x.ItemCode == r.ItemCode, cancellationToken);
        if (item is null)
        {
            item = new StockItem { CompanyId = r.CompanyId, ItemCode = r.ItemCode.Trim(), ItemName = r.ItemName.Trim(), UnitName = r.UnitName.Trim() };
            db.Add(item);
        }

        item.BalanceQty += r.Quantity;
        item.UpdatedAt = BusinessTime.Now;
        db.Add(new StockTransaction { CompanyId = r.CompanyId, StockItemId = item.Id, TransactionType = "Receive", Quantity = r.Quantity, ReferenceNo = r.ReferenceNo });
        await db.SaveChangesAsync(cancellationToken);
        return new StockItemDto(item.Id, item.CompanyId, item.ItemCode, item.ItemName, item.UnitName, item.BalanceQty);
    }

    public async Task<StockItemDto> Handle(IssueStockCommand command, CancellationToken cancellationToken)
    {
        var item = await db.StockItems.FirstOrDefaultAsync(x => x.Id == command.ItemId && x.CompanyId == command.Request.CompanyId, cancellationToken) ?? throw new KeyNotFoundException("Stock item not found.");
        if (item.BalanceQty < command.Request.Quantity)
        {
            throw new InvalidOperationException("Insufficient stock balance.");
        }

        item.BalanceQty -= command.Request.Quantity;
        item.UpdatedAt = BusinessTime.Now;
        db.Add(new StockTransaction { CompanyId = item.CompanyId, StockItemId = item.Id, TransactionType = "Issue", Quantity = command.Request.Quantity, ReferenceNo = command.Request.ReferenceNo });
        await db.SaveChangesAsync(cancellationToken);
        return new StockItemDto(item.Id, item.CompanyId, item.ItemCode, item.ItemName, item.UnitName, item.BalanceQty);
    }
}

public static class DependencyInjection
{
    public static IServiceCollection AddInventoryApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));
        return services;
    }
}
