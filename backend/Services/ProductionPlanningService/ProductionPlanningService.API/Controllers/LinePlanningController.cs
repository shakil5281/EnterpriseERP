using Erp.BuildingBlocks.CommonResponses;
using Microsoft.AspNetCore.Mvc;
using ProductionPlanningService.Domain;

namespace ProductionPlanningService.API.Controllers;

[ApiController]
[Route("api/v1/production/line-planning")]
public sealed class LinePlanningController(LinePlanningStore store) : ControllerBase
{
    [HttpGet]
    public ActionResult<ApiResponse<IReadOnlyList<OrderCapacityPlan>>> Get(
        [FromQuery] Guid companyId,
        [FromQuery] Guid? orderId) =>
        Ok(ApiResponse<IReadOnlyList<OrderCapacityPlan>>.Ok(store.GetByCompany(companyId, orderId), HttpContext.TraceIdentifier));

    [HttpPost]
    public ActionResult<ApiResponse<OrderCapacityPlan>> Create([FromBody] CreateLinePlanRequest request)
    {
        var plan = new OrderCapacityPlan
        {
            CompanyId = request.CompanyId,
            OrderId = request.OrderId,
            LineCode = request.LineCode.Trim(),
            LineName = request.LineName.Trim(),
            PlanDate = request.PlanDate,
            PlannedQty = request.PlannedQty,
            DailyCapacity = request.DailyCapacity,
            Status = request.Status ?? "Planned",
        };
        store.Add(plan);
        return Ok(ApiResponse<OrderCapacityPlan>.Ok(plan, HttpContext.TraceIdentifier));
    }
}

public sealed record CreateLinePlanRequest(
    Guid CompanyId,
    Guid OrderId,
    string LineCode,
    string LineName,
    DateOnly PlanDate,
    int PlannedQty,
    int DailyCapacity,
    string? Status = null);
