using ClubActivityService.Data;
using ClubActivityService.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClubActivityService.Controllers;

[ApiController]
[Route("api/clubs")]
[Authorize]
public class ClubsController : ControllerBase
{
    private readonly ClubDbContext _db;

    public ClubsController(ClubDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Clubs.Include(c => c.Activities).OrderBy(c => c.Name).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var club = await _db.Clubs.Include(c => c.Activities).FirstOrDefaultAsync(c => c.Id == id);
        return club is null ? NotFound() : Ok(club);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ClubProfile club)
    {
        club.Id = string.IsNullOrWhiteSpace(club.Id) ? Guid.NewGuid().ToString("N") : club.Id;
        club.CreatedAt = DateTimeOffset.UtcNow;
        _db.Clubs.Add(club);
        await _db.SaveChangesAsync();
        return Created($"/api/clubs/{club.Id}", club);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] ClubProfile payload)
    {
        var club = await _db.Clubs.FindAsync(id);
        if (club is null) return NotFound();
        club.Name = payload.Name;
        club.Description = payload.Description;
        club.Address = payload.Address;
        club.ContactEmail = payload.ContactEmail;
        club.IsVisible = payload.IsVisible;
        club.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(club);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var club = await _db.Clubs.FindAsync(id);
        if (club is null) return NotFound();
        _db.Clubs.Remove(club);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id}/visibility")]
    public async Task<IActionResult> ToggleVisibility(string id)
    {
        var club = await _db.Clubs.FindAsync(id);
        if (club is null) return NotFound();
        club.IsVisible = !club.IsVisible;
        club.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { club.Id, club.IsVisible });
    }

    [HttpPatch("{id}/contact-email")]
    public async Task<IActionResult> UpdateEmail(string id, [FromBody] UpdateEmailRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.ContactEmail))
            return BadRequest(new { message = "Contact email is required." });
        var club = await _db.Clubs.FindAsync(id);
        if (club is null) return NotFound();
        club.ContactEmail = req.ContactEmail.Trim().ToLowerInvariant();
        club.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { club.Id, club.ContactEmail });
    }
}

public record UpdateEmailRequest(string? ContactEmail);
