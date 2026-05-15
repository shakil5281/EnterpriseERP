using Erp.BuildingBlocks.SharedKernel;

namespace NotificationService.Domain.Entities;

public sealed class Notification : AuditableEntity
{
    public Guid Id { get; set; }
    public Guid RecipientId { get; set; }
    public string RecipientEmail { get; set; } = string.Empty;
    public string RecipientPhone { get; set; } = string.Empty;
    public string Type { get; set; } = "Email"; // Email, SMS, InApp
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, Sent, Failed, Read
    public DateTime? SentAt { get; set; }
    public string? ErrorMessage { get; set; }
}
