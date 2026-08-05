using System.Security.Claims;
using ComplianceService.Data;
using ComplianceService.Models;
using HAF.Shared.Events;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ComplianceService.Controllers;

[ApiController]
[Route("api/deletion-requests")]
[Authorize]
public class DeletionRequestsController : ControllerBase
{
    private readonly ComplianceDbContext _db;
    private readonly IPublishEndpoint _publish;

    public DeletionRequestsController(ComplianceDbContext db, IPublishEndpoint publish)
    {
        _db = db;
        _publish = publish;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? userId)
    {
        var query = _db.DeletionRequests.AsQueryable();
        if (!string.IsNullOrWhiteSpace(userId))
            query = query.Where(d => d.RequestedByUserId == userId);
        return Ok(await query.OrderByDescending(d => d.RequestedAt).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var dr = await _db.DeletionRequests.FindAsync(id);
        return dr is null ? NotFound() : Ok(dr);
    }

    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] SubmitDeletionRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.SubjectType) || string.IsNullOrWhiteSpace(req.SubjectId))
            return BadRequest(new { message = "SubjectType and SubjectId are required." });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Unauthorized();

        var dr = new DeletionRequest
        {
            Id                = Guid.NewGuid().ToString("N"),
            SubjectType       = req.SubjectType.Trim(),
            SubjectId         = req.SubjectId.Trim(),
            RequestedByUserId = userId,
            Reason            = req.Reason ?? string.Empty,
            Status            = "Pending",
            RequestedAt       = DateTimeOffset.UtcNow,
        };

        _db.DeletionRequests.Add(dr);
        await _db.SaveChangesAsync();
        return Created($"/api/deletion-requests/{dr.Id}", dr);
    }

    [HttpPost("{id}/process")]
    public async Task<IActionResult> Process(string id, [FromBody] ProcessRequest req)
    {
        var allowed = new[] { "approved", "rejected" };
        if (!allowed.Contains(req.Status?.ToLowerInvariant()))
            return BadRequest(new { message = "Status must be 'approved' or 'rejected'." });

        var dr = await _db.DeletionRequests.FindAsync(id);
        if (dr is null) return NotFound();

        dr.Status      = req.Status!.ToLowerInvariant() == "approved" ? "Approved" : "Rejected";
        dr.ProcessedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        if (dr.Status == "Approved")
            await _publish.Publish(new DeletionRequestApproved(dr.Id, dr.SubjectType, dr.SubjectId, dr.ProcessedAt.Value));
        else
            await _publish.Publish(new DeletionRequestRejected(dr.Id, dr.SubjectType, dr.SubjectId, dr.ProcessedAt.Value));

        return Ok(dr);
    }
}

public record SubmitDeletionRequest(string? SubjectType, string? SubjectId, string? Reason);
public record ProcessRequest(string? Status, string? Notes);
