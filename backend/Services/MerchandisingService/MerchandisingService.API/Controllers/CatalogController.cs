using MediatR;
using MerchandisingService.Application;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MerchandisingService.API.Controllers;

[ApiController]
[Route("api/seasons")]
public sealed class SeasonsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = MerchandisingPermissions.StyleManage)]
    public async Task<ActionResult<ApiResponse<SeasonDto>>> Create(CreateSeasonRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<SeasonDto>.Ok(await mediator.Send(new CreateSeasonCommand(request), cancellationToken), "Season created."));

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SeasonDto>>>> Get([FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<SeasonDto>>.Ok(await mediator.Send(new GetSeasonsQuery(companyId), cancellationToken)));
}

[ApiController]
[Route("api/garment-items")]
public sealed class GarmentItemsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = MerchandisingPermissions.StyleManage)]
    public async Task<ActionResult<ApiResponse<GarmentItemDto>>> Create(CreateGarmentItemRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<GarmentItemDto>.Ok(await mediator.Send(new CreateGarmentItemCommand(request), cancellationToken), "Garment item created."));

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<GarmentItemDto>>>> Get([FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<GarmentItemDto>>.Ok(await mediator.Send(new GetGarmentItemsQuery(companyId), cancellationToken)));
}

[ApiController]
[Route("api/styles")]
public sealed class StylesController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = MerchandisingPermissions.StyleManage)]
    public async Task<ActionResult<ApiResponse<StyleDto>>> Create(CreateStyleRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StyleDto>.Ok(await mediator.Send(new CreateStyleCommand(request), cancellationToken), "Style created."));

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StyleDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid? buyerId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<StyleDto>>.Ok(await mediator.Send(new GetStylesQuery(companyId, buyerId), cancellationToken)));

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<StyleDto>>> GetById(Guid id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StyleDto>.Ok(await mediator.Send(new GetStyleByIdQuery(id), cancellationToken)));

    [HttpPut("{id:guid}")]
    [Authorize(Policy = MerchandisingPermissions.StyleManage)]
    public async Task<ActionResult<ApiResponse<StyleDto>>> Update(Guid id, UpdateStyleRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StyleDto>.Ok(await mediator.Send(new UpdateStyleCommand(id, request), cancellationToken), "Style updated."));
}
