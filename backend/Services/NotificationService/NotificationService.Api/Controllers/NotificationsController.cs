using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NotificationService.Domain.Entities;
using NotificationService.Infrastructure.Persistence;

using Erp.BuildingBlocks.SharedKernel;

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
        notification.CreatedAt = BusinessTime.NowOffset;
        notification.Status = "Sent"; // Simplified for now
        notification.SentAt = BusinessTime.Now;
        
        context.Notifications.Add(notification);
        await context.SaveChangesAsync();
        
        return Ok(notification);
    }
}
