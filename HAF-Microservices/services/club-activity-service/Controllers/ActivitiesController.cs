using ClubActivityService.Data;
using ClubActivityService.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClubActivityService.Controllers;

[ApiController]
[Route("api/activities")]
[Authorize]
public class ActivitiesController : ControllerBase
{
    private readonly ClubDbContext _db;

    public ActivitiesController(ClubDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? clubId) =>
        Ok(await _db.Activities
            .Include(a => a.ClubProfile)
            .Where(a => clubId == null || a.ClubProfileId == clubId)
            .OrderBy(a => a.StartDateTime)
            .ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var activity = await _db.Activities.Include(a => a.ClubProfile).FirstOrDefaultAsync(a => a.Id == id);
        return activity is null ? NotFound() : Ok(activity);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Activity activity)
    {
        activity.Id = string.IsNullOrWhiteSpace(activity.Id) ? Guid.NewGuid().ToString("N") : activity.Id;
        activity.CreatedAt = DateTimeOffset.UtcNow;
        _db.Activities.Add(activity);
        await _db.SaveChangesAsync();
        return Created($"/api/activities/{activity.Id}", activity);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] Activity payload)
    {
        var activity = await _db.Activities.FindAsync(id);
        if (activity is null) return NotFound();
        activity.Title = payload.Title;
        activity.Description = payload.Description;
        activity.ClubProfileId = payload.ClubProfileId;
        activity.CycleId = payload.CycleId;
        activity.StartDateTime = payload.StartDateTime;
        activity.EndDateTime = payload.EndDateTime;
        activity.Capacity = payload.Capacity;
        activity.IsActive = payload.IsActive;
        activity.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(activity);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var activity = await _db.Activities.FindAsync(id);
        if (activity is null) return NotFound();
        _db.Activities.Remove(activity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
