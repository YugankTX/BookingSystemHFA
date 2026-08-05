using FamilyService.Data;
using FamilyService.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FamilyService.Controllers;

[ApiController]
[Route("api/children")]
[Authorize]
public class ChildrenController : ControllerBase
{
    private readonly FamilyDbContext _db;

    public ChildrenController(FamilyDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Children.OrderBy(c => c.FullName).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var child = await _db.Children.FirstOrDefaultAsync(c => c.Id == id);
        return child is null ? NotFound() : Ok(child);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ChildRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.FullName) || string.IsNullOrWhiteSpace(req.ParentGuardianId))
            return BadRequest(new { message = "Full name and ParentGuardianId are required." });

        if (!await _db.Parents.AnyAsync(p => p.Id == req.ParentGuardianId))
            return BadRequest(new { message = "Parent/guardian not found." });

        var child = new Child
        {
            Id               = Guid.NewGuid().ToString("N"),
            FullName         = req.FullName.Trim(),
            DateOfBirth      = req.DateOfBirth,
            UPN              = req.Upn,
            FsmEligible      = req.FsmEligible,
            FsmVerified      = false,
            ParentGuardianId = req.ParentGuardianId,
            CreatedAt        = DateTimeOffset.UtcNow,
        };

        _db.Children.Add(child);
        await _db.SaveChangesAsync();
        return Created($"/api/children/{child.Id}", child);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] ChildRequest req)
    {
        var child = await _db.Children.FindAsync(id);
        if (child is null) return NotFound();
        child.FullName    = req.FullName?.Trim() ?? child.FullName;
        child.DateOfBirth = req.DateOfBirth == default ? child.DateOfBirth : req.DateOfBirth;
        child.UPN         = req.Upn ?? child.UPN;
        child.FsmEligible = req.FsmEligible;
        child.UpdatedAt   = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(child);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var child = await _db.Children.FindAsync(id);
        if (child is null) return NotFound();
        _db.Children.Remove(child);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id}/fsm")]
    public async Task<IActionResult> UpdateFsm(string id, [FromBody] FsmRequest req)
    {
        var child = await _db.Children.FindAsync(id);
        if (child is null) return NotFound();
        child.FsmEligible = req.FsmEligible;
        child.FsmVerified = req.FsmVerified;
        child.UpdatedAt   = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { child.Id, child.FsmEligible, child.FsmVerified });
    }
}

public record ChildRequest(string? FullName, DateTimeOffset DateOfBirth, string? Upn, bool FsmEligible, string? ParentGuardianId);
public record FsmRequest(bool FsmEligible, bool FsmVerified);
