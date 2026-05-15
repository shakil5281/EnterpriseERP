using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NotificationService.Domain.Entities;
using NotificationService.Infrastructure.Persistence;

namespace NotificationService.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class NotificationsController(NotificationDbContext context) : ControllerBase
{
    [HttpGet("recipient/{recipientId}")]
    public async Task<IActionResult> GetByRecipient(Guid recipientId)
    {
        var data = await context.Notifications
            .Where(x => x.RecipientId == recipientId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();
        return Ok(data);
    }

    [HttpPost("send")]
    public async Task<IActionResult> Send(Notification notification)
    {
        notification.Id = Guid.NewGuid();
        notification.CreatedAt = DateTimeOffset.UtcNow;
        notification.Status = "Sent"; // Simplified for now
        notification.SentAt = DateTime.UtcNow;
        
        context.Notifications.Add(notification);
        await context.SaveChangesAsync();
        
        return Ok(notification);
    }
}
