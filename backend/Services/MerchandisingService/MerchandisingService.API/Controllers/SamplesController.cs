using MediatR;
using MerchandisingService.Application;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MerchandisingService.API.Controllers;

[ApiController]
[Route("api/samples")]
public sealed class SamplesController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = MerchandisingPermissions.SampleManage)]
    public async Task<ActionResult<ApiResponse<SampleDto>>> Create(CreateSampleRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<SampleDto>.Ok(await mediator.Send(new CreateSampleCommand(request), cancellationToken), "Sample created."));

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SampleDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid? styleId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<SampleDto>>.Ok(await mediator.Send(new GetSamplesQuery(companyId, styleId), cancellationToken)));

    [HttpPatch("{id:guid}/approve")]
    [Authorize(Policy = MerchandisingPermissions.SampleManage)]
    public async Task<ActionResult<ApiResponse<SampleDto>>> Approve(Guid id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<SampleDto>.Ok(await mediator.Send(new ApproveSampleCommand(id), cancellationToken), "Sample approved."));

    [HttpPatch("{id:guid}/reject")]
    [Authorize(Policy = MerchandisingPermissions.SampleManage)]
    public async Task<ActionResult<ApiResponse<SampleDto>>> Reject(Guid id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<SampleDto>.Ok(await mediator.Send(new RejectSampleCommand(id), cancellationToken), "Sample rejected."));
}
