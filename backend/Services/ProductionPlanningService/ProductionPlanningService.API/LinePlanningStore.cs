using System.Collections.Concurrent;
using ProductionPlanningService.Domain;

namespace ProductionPlanningService.API;

public sealed class LinePlanningStore
{
    private readonly ConcurrentDictionary<Guid, OrderCapacityPlan> _plans = new();

    public IReadOnlyList<OrderCapacityPlan> GetByCompany(Guid companyId, Guid? orderId = null)
    {
        return _plans.Values
            .Where(x => x.CompanyId == companyId && (!orderId.HasValue || x.OrderId == orderId.Value))
            .OrderBy(x => x.PlanDate)
            .ThenBy(x => x.LineCode)
            .ToList();
    }

    public OrderCapacityPlan Add(OrderCapacityPlan plan)
    {
        _plans[plan.Id] = plan;
        return plan;
    }
}
