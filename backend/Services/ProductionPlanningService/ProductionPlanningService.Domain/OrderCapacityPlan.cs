using Erp.BuildingBlocks.SharedKernel;

namespace ProductionPlanningService.Domain;

public sealed class OrderCapacityPlan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public Guid OrderId { get; set; }
    public string LineCode { get; set; } = string.Empty;
    public string LineName { get; set; } = string.Empty;
    public DateOnly PlanDate { get; set; }
    public int PlannedQty { get; set; }
    public int DailyCapacity { get; set; }
    public string Status { get; set; } = "Planned";
    public DateTime CreatedAt { get; set; } = BusinessTime.Now;
}
