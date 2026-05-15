using Erp.BuildingBlocks.SharedKernel;

namespace NotificationService.Domain.Entities;

public sealed class NotificationTemplate : AuditableEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Email"; // Email, SMS, InApp
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
