using System.Security.Claims;
using FamilyService.Data;
using FamilyService.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FamilyService.Controllers;

[ApiController]
[Route("api/parents")]
[Authorize]
public class ParentsController : ControllerBase
{
    private readonly FamilyDbContext _db;

    public ParentsController(FamilyDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Parents.OrderBy(p => p.FullName).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var parent = await _db.Parents.FirstOrDefaultAsync(p => p.Id == id);
        return parent is null ? NotFound() : Ok(parent);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ParentRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.FullName) || string.IsNullOrWhiteSpace(req.Email))
            return BadRequest(new { message = "Full name and email are required." });

        var parent = new ParentGuardian
        {
            Id        = Guid.NewGuid().ToString("N"),
            FullName  = req.FullName.Trim(),
            Email     = req.Email.Trim().ToLowerInvariant(),
            Phone     = req.Phone ?? string.Empty,
            UserId    = User.FindFirstValue(ClaimTypes.NameIdentifier),
            CreatedAt = DateTimeOffset.UtcNow,
        };

        _db.Parents.Add(parent);
        await _db.SaveChangesAsync();
        return Created($"/api/parents/{parent.Id}", parent);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] ParentRequest req)
    {
        var parent = await _db.Parents.FindAsync(id);
        if (parent is null) return NotFound();
        parent.FullName  = req.FullName?.Trim() ?? parent.FullName;
        parent.Email     = req.Email?.Trim().ToLowerInvariant() ?? parent.Email;
        parent.Phone     = req.Phone ?? parent.Phone;
        parent.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(parent);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var parent = await _db.Parents.FindAsync(id);
        if (parent is null) return NotFound();
        _db.Parents.Remove(parent);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record ParentRequest(string? FullName, string? Email, string? Phone);
