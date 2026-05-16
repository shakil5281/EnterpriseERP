using MerchandisingService.Contracts;
using MerchandisingService.Domain;

namespace MerchandisingService.Application;

public sealed class BomCalculationService : IBomCalculationService
{
    public BomItem Calculate(BomItem item, int orderQuantity)
    {
        var baseRequired = orderQuantity * item.Consumption;
        item.RequiredQty = Math.Round(baseRequired + (baseRequired * item.WastagePercent / 100m), 4);
        item.TotalCost = Math.Round(item.RequiredQty * item.UnitPrice, 4);
        return item;
    }

    public BomCalculationResultDto Summarize(Guid orderId, IReadOnlyCollection<BomItem> items) =>
        new(orderId, items.Count, items.Sum(x => x.RequiredQty), items.Sum(x => x.TotalCost));
}

public sealed class CostingCalculationService : ICostingCalculationService
{
    public OrderCosting Calculate(OrderCosting costing)
    {
        costing.TotalCost = Math.Round(
            costing.FabricCost + costing.AccessoriesCost + costing.CM + costing.WashingCost +
            costing.EmbroideryCost + costing.PrintingCost + costing.OtherCost, 4);
        costing.ProfitAmount = Math.Round(costing.SellingPrice - costing.TotalCost, 4);
        costing.ProfitPercent = costing.SellingPrice <= 0 ? 0 : Math.Round(costing.ProfitAmount / costing.SellingPrice * 100m, 2);
        return costing;
    }
}
