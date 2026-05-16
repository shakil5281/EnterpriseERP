using MediatR;
using MerchandisingService.Application;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MerchandisingService.API.Controllers;

[ApiController]
[Route("api/buyers")]
public sealed class BuyersController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = MerchandisingPermissions.BuyerManage)]
    public async Task<ActionResult<ApiResponse<BuyerDto>>> Create(CreateBuyerRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<BuyerDto>.Ok(await mediator.Send(new CreateBuyerCommand(request), cancellationToken), "Buyer created."));

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BuyerDto>>>> Get([FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<BuyerDto>>.Ok(await mediator.Send(new GetBuyersQuery(companyId), cancellationToken)));

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<BuyerDto>>> GetById(Guid id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<BuyerDto>.Ok(await mediator.Send(new GetBuyerByIdQuery(id), cancellationToken)));

    [HttpPut("{id:guid}")]
    [Authorize(Policy = MerchandisingPermissions.BuyerManage)]
    public async Task<ActionResult<ApiResponse<BuyerDto>>> Update(Guid id, UpdateBuyerRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<BuyerDto>.Ok(await mediator.Send(new UpdateBuyerCommand(id, request), cancellationToken), "Buyer updated."));

    [HttpPatch("{id:guid}/activate")]
    [Authorize(Policy = MerchandisingPermissions.BuyerManage)]
    public async Task<ActionResult<ApiResponse<BuyerDto>>> Activate(Guid id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<BuyerDto>.Ok(await mediator.Send(new ActivateBuyerCommand(id, true), cancellationToken), "Buyer activated."));

    [HttpPatch("{id:guid}/deactivate")]
    [Authorize(Policy = MerchandisingPermissions.BuyerManage)]
    public async Task<ActionResult<ApiResponse<BuyerDto>>> Deactivate(Guid id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<BuyerDto>.Ok(await mediator.Send(new ActivateBuyerCommand(id, false), cancellationToken), "Buyer deactivated."));
}
