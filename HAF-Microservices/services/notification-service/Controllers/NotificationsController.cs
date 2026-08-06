using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NotificationService.Data;

namespace NotificationService.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly NotificationDbContext _db;

    public NotificationsController(NotificationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;

        var notifications = await _db.Notifications
            .Where(n => n.TargetRole == role || n.TargetRole == "all")
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .ToListAsync();

        return Ok(notifications);
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount()
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;

        var count = await _db.Notifications
            .CountAsync(n => (n.TargetRole == role || n.TargetRole == "all") && !n.IsRead);

        return Ok(new { count });
    }

    [HttpPatch("{id}/read")]
    public async Task<IActionResult> MarkRead(string id)
    {
        var notification = await _db.Notifications.FindAsync(id);
        if (notification is null) return NotFound();
        notification.IsRead = true;
        await _db.SaveChangesAsync();
        return Ok(notification);
    }

    [HttpPost("mark-all-read")]
    public async Task<IActionResult> MarkAllRead()
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;

        var unread = await _db.Notifications
            .Where(n => (n.TargetRole == role || n.TargetRole == "all") && !n.IsRead)
            .ToListAsync();

        foreach (var n in unread) n.IsRead = true;
        await _db.SaveChangesAsync();

        return Ok(new { marked = unread.Count });
    }
}
