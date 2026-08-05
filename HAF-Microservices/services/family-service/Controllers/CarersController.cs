using FamilyService.Data;
using FamilyService.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FamilyService.Controllers;

[ApiController]
[Route("api/carers")]
[Authorize]
public class CarersController : ControllerBase
{
    private readonly FamilyDbContext _db;

    public CarersController(FamilyDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Carers.OrderBy(c => c.FullName).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var carer = await _db.Carers.FindAsync(id);
        return carer is null ? NotFound() : Ok(carer);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CarerRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.FullName) || string.IsNullOrWhiteSpace(req.ChildId))
            return BadRequest(new { message = "Full name and ChildId are required." });

        if (!await _db.Children.AnyAsync(c => c.Id == req.ChildId))
            return BadRequest(new { message = "Child not found." });

        var carer = new Carer
        {
            Id        = Guid.NewGuid().ToString("N"),
            FullName  = req.FullName.Trim(),
            Email     = req.Email ?? string.Empty,
            Phone     = req.Phone ?? string.Empty,
            ChildId   = req.ChildId,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        _db.Carers.Add(carer);
        await _db.SaveChangesAsync();
        return Created($"/api/carers/{carer.Id}", carer);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] CarerRequest req)
    {
        var carer = await _db.Carers.FindAsync(id);
        if (carer is null) return NotFound();
        carer.FullName  = req.FullName?.Trim() ?? carer.FullName;
        carer.Email     = req.Email ?? carer.Email;
        carer.Phone     = req.Phone ?? carer.Phone;
        carer.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(carer);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var carer = await _db.Carers.FindAsync(id);
        if (carer is null) return NotFound();
        _db.Carers.Remove(carer);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record CarerRequest(string? FullName, string? Email, string? Phone, string? ChildId);
