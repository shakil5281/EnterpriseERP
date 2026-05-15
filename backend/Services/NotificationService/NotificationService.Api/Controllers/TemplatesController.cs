using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NotificationService.Domain.Entities;
using NotificationService.Infrastructure.Persistence;

namespace NotificationService.Api.Controllers;

[ApiController]
[Route("api/v1/notifications/[controller]")]
public class TemplatesController(NotificationDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var data = await context.NotificationTemplates.ToListAsync();
        return Ok(data);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var data = await context.NotificationTemplates.FindAsync(id);
        if (data == null) return NotFound();
        return Ok(data);
    }

    [HttpPost]
    public async Task<IActionResult> Create(NotificationTemplate template)
    {
        template.Id = Guid.NewGuid();
        context.NotificationTemplates.Add(template);
        await context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = template.Id }, template);
    }
}
