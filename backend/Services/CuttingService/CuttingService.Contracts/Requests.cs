namespace CuttingService.Contracts;

public sealed record CreateCuttingPlanRequest(Guid CompanyId, Guid OrderId, Guid? StyleId, string PlanNo, DateOnly PlanDate, string? ColorName, int TotalPlanQty, Guid? CreatedBy);
public sealed record UpdateCuttingPlanRequest(Guid? StyleId, DateOnly PlanDate, string? ColorName, int TotalPlanQty, Guid? UpdatedBy);
public sealed record AddCuttingPlanSizeBreakdownRequest(Guid CompanyId, string SizeName, int PlanQty);
public sealed record UpdateCuttingPlanSizeBreakdownRequest(string SizeName, int PlanQty);
public sealed record CreateFabricIssueToCuttingRequest(Guid CompanyId, Guid OrderId, Guid? CuttingPlanId, Guid? InventoryIssueId, string IssueNo, DateOnly IssueDate, Guid FabricItemId, decimal IssueQty, string UnitName, string? LotNo, string? BatchNo, string? ColorName, Guid? CreatedBy);
public sealed record CreateCuttingLaySizeDetailRequest(string SizeName, int RatioQty, int PlyQty);
public sealed record CreateCuttingLayRequest(Guid CompanyId, Guid CuttingPlanId, string LayNo, DateOnly LayDate, string? MarkerNo, decimal FabricLength, int PlyQty, int LayQty, Guid? CreatedBy, IReadOnlyList<CreateCuttingLaySizeDetailRequest> SizeDetails);
public sealed record UpdateCuttingLayRequest(string LayNo, DateOnly LayDate, string? MarkerNo, decimal FabricLength, int PlyQty, int LayQty, string Status, Guid? UpdatedBy);
public sealed record CreateCuttingOutputRequest(Guid CompanyId, Guid CuttingPlanId, Guid? CuttingLayId, Guid OrderId, DateOnly OutputDate, string? ColorName, string SizeName, int OutputQty, bool IsOverageApproved, Guid? CreatedBy);
public sealed record CreateCuttingWastageRequest(Guid CompanyId, Guid CuttingPlanId, Guid OrderId, DateOnly WastageDate, Guid? FabricItemId, decimal WastageQty, string WastageReason, Guid? CreatedBy);
public sealed record CreatePanelTransferItemRequest(string? ColorName, string SizeName, int TransferQty);
public sealed record CreatePanelTransferRequest(Guid CompanyId, Guid OrderId, Guid CuttingPlanId, string TransferNo, DateOnly TransferDate, string? ToDepartment, Guid? CreatedBy, IReadOnlyList<CreatePanelTransferItemRequest> Items);
public sealed record CuttingReportExportRequest(Guid CompanyId, Guid? OrderId, string ReportType, DateOnly? FromDate, DateOnly? ToDate, string Format);
