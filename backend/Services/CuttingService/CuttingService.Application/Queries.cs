using CuttingService.Contracts;
using MediatR;

namespace CuttingService.Application;

public sealed record GetCuttingPlansQuery(Guid CompanyId, Guid? OrderId, string? Status) : IRequest<IReadOnlyList<CuttingPlanDto>>;
public sealed record GetCuttingPlanByIdQuery(Guid Id) : IRequest<CuttingPlanDto>;
public sealed record GetCuttingPlanSizeBreakdownsQuery(Guid PlanId) : IRequest<IReadOnlyList<CuttingPlanSizeBreakdownDto>>;
public sealed record GetFabricIssuesToCuttingQuery(Guid CompanyId, Guid? OrderId, Guid? PlanId) : IRequest<IReadOnlyList<FabricIssueToCuttingDto>>;
public sealed record GetFabricIssueToCuttingByIdQuery(Guid Id) : IRequest<FabricIssueToCuttingDto>;
public sealed record GetCuttingLaysQuery(Guid CompanyId, Guid? PlanId) : IRequest<IReadOnlyList<CuttingLayDto>>;
public sealed record GetCuttingLayByIdQuery(Guid Id) : IRequest<CuttingLayDto>;
public sealed record GetCuttingOutputsQuery(Guid CompanyId, Guid? OrderId, Guid? PlanId) : IRequest<IReadOnlyList<CuttingOutputDto>>;
public sealed record GetCuttingOutputByIdQuery(Guid Id) : IRequest<CuttingOutputDto>;
public sealed record GetCuttingWastagesQuery(Guid CompanyId, Guid? OrderId, Guid? PlanId) : IRequest<IReadOnlyList<CuttingWastageDto>>;
public sealed record GetCuttingBalancesQuery(Guid CompanyId, Guid OrderId) : IRequest<IReadOnlyList<CuttingBalanceDto>>;
public sealed record GetCuttingPanelTransfersQuery(Guid CompanyId, Guid? OrderId) : IRequest<IReadOnlyList<CuttingPanelTransferDto>>;
public sealed record GetCuttingPanelTransferByIdQuery(Guid Id) : IRequest<CuttingPanelTransferDto>;
public sealed record GetCuttingReportQuery(Guid CompanyId, Guid? OrderId, string ReportType, DateOnly? FromDate, DateOnly? ToDate) : IRequest<IReadOnlyList<CuttingReportRowDto>>;
