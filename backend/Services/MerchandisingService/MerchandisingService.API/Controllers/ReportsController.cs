using System.Text;
using MediatR;
using MerchandisingService.Application;
using MerchandisingService.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using Erp.BuildingBlocks.SharedKernel;

namespace MerchandisingService.API.Controllers;

[ApiController]
[Route("api/reports")]
public sealed class ReportsController(IMediator mediator) : ControllerBase
{
    [HttpGet("order-summary.csv")]
    [Authorize(Policy = MerchandisingPermissions.ReportView)]
    public async Task<IActionResult> ExportOrderSummary([FromQuery] Guid companyId, [FromQuery] Guid? buyerId, [FromQuery] string? status, CancellationToken cancellationToken)
    {
        var orders = await mediator.Send(new GetOrdersQuery(companyId, buyerId, status), cancellationToken);
        var csv = new StringBuilder();
        csv.AppendLine("OrderId,OrderNo,BuyerId,StyleId,OrderDate,ShipmentDate,Quantity,UnitPrice,TotalValue,Currency,Status");
        foreach (var order in orders)
        {
            csv.AppendLine($"{order.Id},{order.OrderNo},{order.BuyerId},{order.StyleId},{order.OrderDate},{order.ShipmentDate},{order.TotalOrderQty},{order.UnitPrice},{order.TotalValue},{order.CurrencyCode},{order.OrderStatus}");
        }

        return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"merchandising-order-summary-{BusinessTime.Now:yyyyMMddHHmmss}.csv");
    }
}
