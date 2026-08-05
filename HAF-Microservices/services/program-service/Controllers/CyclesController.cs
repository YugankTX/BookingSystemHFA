using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProgramService.Data;
using ProgramService.Models;

namespace ProgramService.Controllers;

[ApiController]
[Route("api/cycles")]
[Authorize]
public class CyclesController : ControllerBase
{
    private readonly ProgramDbContext _db;

    public CyclesController(ProgramDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Cycles.OrderByDescending(c => c.StartDate).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var cycle = await _db.Cycles.FindAsync(id);
        return cycle is null ? NotFound() : Ok(cycle);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] HafCycle cycle)
    {
        cycle.Id        = string.IsNullOrWhiteSpace(cycle.Id) ? Guid.NewGuid().ToString("N") : cycle.Id;
        cycle.CreatedAt = DateTimeOffset.UtcNow;
        _db.Cycles.Add(cycle);
        await _db.SaveChangesAsync();
        return Created($"/api/cycles/{cycle.Id}", cycle);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] HafCycle payload)
    {
        var cycle = await _db.Cycles.FindAsync(id);
        if (cycle is null) return NotFound();
        cycle.Name        = payload.Name;
        cycle.Description = payload.Description;
        cycle.StartDate   = payload.StartDate;
        cycle.EndDate     = payload.EndDate;
        cycle.IsActive    = payload.IsActive;
        cycle.UpdatedAt   = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(cycle);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var cycle = await _db.Cycles.FindAsync(id);
        if (cycle is null) return NotFound();
        _db.Cycles.Remove(cycle);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
