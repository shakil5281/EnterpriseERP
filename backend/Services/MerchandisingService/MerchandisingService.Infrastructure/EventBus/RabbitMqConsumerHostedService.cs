using MerchandisingService.Application;
using MerchandisingService.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MerchandisingService.Infrastructure.EventBus;

public sealed class RabbitMqConsumerHostedService(IServiceScopeFactory scopeFactory, ILogger<RabbitMqConsumerHostedService> logger) : BackgroundService
{
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("MerchandisingService RabbitMQ consumers registered for CuttingStarted, ProductionStarted, ProductionCompleted, ShipmentCompleted, StockReceived, and PurchaseOrderCreated.");
        return Task.CompletedTask;
    }

    public async Task MarkProductionStartedAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IMerchandisingDbContext>();
        var order = await db.Orders.FirstOrDefaultAsync(x => x.CompanyId == companyId && x.Id == orderId, cancellationToken);
        if (order is null)
        {
            return;
        }

        if (order.OrderStatus != OrderStatuses.Confirmed)
        {
            throw new InvalidOperationException("Production cannot start before order confirmation.");
        }

        order.OrderStatus = OrderStatuses.InProduction;
        await db.SaveChangesAsync(cancellationToken);
    }
}
