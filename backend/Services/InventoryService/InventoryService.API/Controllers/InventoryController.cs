using MediatR;
using InventoryService.Application;
using InventoryService.Contracts;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InventoryService.API.Controllers;

[ApiController]
[Route("api/v1/inventory")]
public sealed class InventoryController(IMediator mediator, IInventoryDbContext db) : ControllerBase
{
    [HttpPost("receive")]
    public async Task<ActionResult<ApiResponse<StockItemDto>>> Receive(ReceiveStockRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StockItemDto>.Ok(await mediator.Send(new ReceiveStockCommand(request), cancellationToken), "Stock received."));

    [HttpPost("items/{itemId:guid}/issue")]
    public async Task<ActionResult<ApiResponse<StockItemDto>>> Issue(Guid itemId, IssueStockRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StockItemDto>.Ok(await mediator.Send(new IssueStockCommand(itemId, request), cancellationToken), "Stock issued."));

    [HttpGet("items/{itemId:guid}/exists")]
    public async Task<ActionResult<bool>> Exists(Guid itemId, [FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(await db.StockItems.AnyAsync(x => x.Id == itemId && x.CompanyId == companyId, cancellationToken));

    [HttpGet("items/{itemId:guid}/stock-balance")]
    public async Task<ActionResult<decimal>> Balance(Guid itemId, [FromQuery] Guid companyId, CancellationToken cancellationToken)
    {
        var item = await db.StockItems.FirstOrDefaultAsync(x => x.Id == itemId && x.CompanyId == companyId, cancellationToken);
        return Ok(item?.BalanceQty ?? 0);
    }
}
