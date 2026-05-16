using MediatR;
using MerchandisingService.Application;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MerchandisingService.API.Controllers;

[ApiController]
[Route("api/orders")]
public sealed class OrdersController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = MerchandisingPermissions.OrderCreate)]
    public async Task<ActionResult<ApiResponse<OrderDto>>> Create(CreateOrderRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<OrderDto>.Ok(await mediator.Send(new CreateOrderCommand(request), cancellationToken), "Order created."));

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<OrderDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid? buyerId, [FromQuery] string? status, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<OrderDto>>.Ok(await mediator.Send(new GetOrdersQuery(companyId, buyerId, status), cancellationToken)));

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OrderDto>>> GetById(Guid id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<OrderDto>.Ok(await mediator.Send(new GetOrderByIdQuery(id), cancellationToken)));

    [HttpGet("{id:guid}/details")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OrderDetailsDto>>> GetDetails(Guid id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<OrderDetailsDto>.Ok(await mediator.Send(new GetOrderDetailsQuery(id), cancellationToken)));

    [HttpPut("{id:guid}")]
    [Authorize(Policy = MerchandisingPermissions.OrderUpdate)]
    public async Task<ActionResult<ApiResponse<OrderDto>>> Update(Guid id, UpdateOrderRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<OrderDto>.Ok(await mediator.Send(new UpdateOrderCommand(id, request), cancellationToken), "Order updated."));

    [HttpPatch("{id:guid}/confirm")]
    [Authorize(Policy = MerchandisingPermissions.OrderConfirm)]
    public async Task<ActionResult<ApiResponse<OrderDto>>> Confirm(Guid id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<OrderDto>.Ok(await mediator.Send(new ConfirmOrderCommand(id), cancellationToken), "Order confirmed."));

    [HttpPatch("{id:guid}/cancel")]
    [Authorize(Policy = MerchandisingPermissions.OrderCancel)]
    public async Task<ActionResult<ApiResponse<OrderDto>>> Cancel(Guid id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<OrderDto>.Ok(await mediator.Send(new CancelOrderCommand(id), cancellationToken), "Order cancelled."));

    [HttpPost("{orderId:guid}/buyer-pos")]
    [Authorize(Policy = MerchandisingPermissions.OrderUpdate)]
    public async Task<ActionResult<ApiResponse<BuyerPurchaseOrderDto>>> CreateBuyerPo(Guid orderId, CreateBuyerPoRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<BuyerPurchaseOrderDto>.Ok(await mediator.Send(new CreateBuyerPoCommand(orderId, request), cancellationToken), "Buyer PO created."));

    [HttpGet("{orderId:guid}/buyer-pos")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BuyerPurchaseOrderDto>>>> GetBuyerPos(Guid orderId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<BuyerPurchaseOrderDto>>.Ok(await mediator.Send(new GetBuyerPosQuery(orderId), cancellationToken)));

    [HttpPost("{orderId:guid}/color-size-breakdown")]
    [Authorize(Policy = MerchandisingPermissions.OrderUpdate)]
    public async Task<ActionResult<ApiResponse<ColorSizeBreakdownDto>>> CreateBreakdown(Guid orderId, CreateColorSizeBreakdownRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<ColorSizeBreakdownDto>.Ok(await mediator.Send(new CreateColorSizeBreakdownCommand(orderId, request), cancellationToken), "Color-size breakdown created."));

    [HttpGet("{orderId:guid}/color-size-breakdown")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ColorSizeBreakdownDto>>>> GetBreakdown(Guid orderId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<ColorSizeBreakdownDto>>.Ok(await mediator.Send(new GetColorSizeBreakdownQuery(orderId), cancellationToken)));

    [HttpPost("{orderId:guid}/bom-items")]
    [Authorize(Policy = MerchandisingPermissions.BomManage)]
    public async Task<ActionResult<ApiResponse<BomItemDto>>> CreateBomItem(Guid orderId, CreateBomItemRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<BomItemDto>.Ok(await mediator.Send(new CreateBomItemCommand(orderId, request), cancellationToken), "BOM item created."));

    [HttpGet("{orderId:guid}/bom-items")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BomItemDto>>>> GetBomItems(Guid orderId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<BomItemDto>>.Ok(await mediator.Send(new GetBomItemsQuery(orderId), cancellationToken)));

    [HttpPost("{orderId:guid}/bom-calculate")]
    [Authorize(Policy = MerchandisingPermissions.BomManage)]
    public async Task<ActionResult<ApiResponse<BomCalculationResultDto>>> CalculateBom(Guid orderId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<BomCalculationResultDto>.Ok(await mediator.Send(new CalculateBomCommand(orderId), cancellationToken), "BOM recalculated."));

    [HttpPost("{orderId:guid}/costing")]
    [Authorize(Policy = MerchandisingPermissions.CostingManage)]
    public async Task<ActionResult<ApiResponse<OrderCostingDto>>> CreateCosting(Guid orderId, CreateOrderCostingRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<OrderCostingDto>.Ok(await mediator.Send(new CreateOrderCostingCommand(orderId, request), cancellationToken), "Costing created."));

    [HttpGet("{orderId:guid}/costing")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OrderCostingDto?>>> GetCosting(Guid orderId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<OrderCostingDto?>.Ok(await mediator.Send(new GetOrderCostingQuery(orderId), cancellationToken)));

    [HttpPut("{orderId:guid}/costing")]
    [Authorize(Policy = MerchandisingPermissions.CostingManage)]
    public async Task<ActionResult<ApiResponse<OrderCostingDto>>> UpdateCosting(Guid orderId, CreateOrderCostingRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<OrderCostingDto>.Ok(await mediator.Send(new UpdateOrderCostingCommand(orderId, request), cancellationToken), "Costing updated."));
}

[ApiController]
[Route("api/buyer-pos")]
public sealed class BuyerPosController(IMediator mediator) : ControllerBase
{
    [HttpPut("{id:guid}")]
    [Authorize(Policy = MerchandisingPermissions.OrderUpdate)]
    public async Task<ActionResult<ApiResponse<BuyerPurchaseOrderDto>>> Update(Guid id, UpdateBuyerPoRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<BuyerPurchaseOrderDto>.Ok(await mediator.Send(new UpdateBuyerPoCommand(id, request), cancellationToken), "Buyer PO updated."));
}

[ApiController]
[Route("api/color-size-breakdown")]
public sealed class ColorSizeBreakdownController(IMediator mediator) : ControllerBase
{
    [HttpPut("{id:guid}")]
    [Authorize(Policy = MerchandisingPermissions.OrderUpdate)]
    public async Task<ActionResult<ApiResponse<ColorSizeBreakdownDto>>> Update(Guid id, UpdateColorSizeBreakdownRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<ColorSizeBreakdownDto>.Ok(await mediator.Send(new UpdateColorSizeBreakdownCommand(id, request), cancellationToken), "Color-size breakdown updated."));

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = MerchandisingPermissions.OrderUpdate)]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id, CancellationToken cancellationToken)
    {
        await mediator.Send(new DeleteColorSizeBreakdownCommand(id), cancellationToken);
        return Ok(ApiResponse<bool>.Ok(true, "Color-size breakdown deleted."));
    }
}

[ApiController]
[Route("api/bom-items")]
public sealed class BomItemsController(IMediator mediator) : ControllerBase
{
    [HttpPut("{id:guid}")]
    [Authorize(Policy = MerchandisingPermissions.BomManage)]
    public async Task<ActionResult<ApiResponse<BomItemDto>>> Update(Guid id, UpdateBomItemRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<BomItemDto>.Ok(await mediator.Send(new UpdateBomItemCommand(id, request), cancellationToken), "BOM item updated."));

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = MerchandisingPermissions.BomManage)]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id, CancellationToken cancellationToken)
    {
        await mediator.Send(new DeleteBomItemCommand(id), cancellationToken);
        return Ok(ApiResponse<bool>.Ok(true, "BOM item deleted."));
    }
}
