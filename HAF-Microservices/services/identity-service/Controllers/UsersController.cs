using HAF.Shared.Events;
using IdentityService.Data;
using IdentityService.Models;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IdentityService.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IdentityDbContext _db;
    private readonly IPublishEndpoint _publish;

    public UsersController(IdentityDbContext db, IPublishEndpoint publish)
    {
        _db = db;
        _publish = publish;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Users
            .OrderBy(u => u.FullName)
            .Select(u => new { u.Id, u.Email, u.FullName, u.Role, u.Phone, u.IsActive, u.CreatedAt })
            .ToListAsync());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.FullName))
            return BadRequest(new { message = "Email and full name are required." });

        var email = req.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(u => u.Email == email))
            return Conflict(new { message = "A user with that email already exists." });

        var user = new AuthUser
        {
            Id           = Guid.NewGuid().ToString("N"),
            Email        = email,
            FullName     = req.FullName.Trim(),
            Role         = string.IsNullOrWhiteSpace(req.Role) ? "parent" : req.Role.Trim().ToLowerInvariant(),
            Phone        = req.Phone ?? string.Empty,
            IsActive     = true,
            PasswordHash = string.IsNullOrWhiteSpace(req.Password) ? "demo123" : req.Password,
            CreatedAt    = DateTimeOffset.UtcNow.ToString("o"),
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        await _publish.Publish(new UserCreated(user.Id, user.Email, user.FullName, user.Role, DateTimeOffset.UtcNow));

        return Created($"/api/users/{user.Id}",
            new { user.Id, user.Email, user.FullName, user.Role, user.Phone, user.IsActive, user.CreatedAt });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateUserRequest req)
    {
        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();

        user.FullName = req.FullName ?? user.FullName;
        user.Email    = req.Email    ?? user.Email;
        user.Role     = req.Role     ?? user.Role;
        user.Phone    = req.Phone    ?? user.Phone;
        user.IsActive = req.IsActive ?? user.IsActive;

        await _db.SaveChangesAsync();
        return Ok(new { user.Id, user.Email, user.FullName, user.Role, user.Phone, user.IsActive, user.CreatedAt });
    }

    [HttpPost("{id}/reactivate")]
    public async Task<IActionResult> Reactivate(string id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();
        user.IsActive = true;
        await _db.SaveChangesAsync();
        return Ok(new { user.Id, user.IsActive });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();
        user.IsActive = false;
        await _db.SaveChangesAsync();
        await _publish.Publish(new UserDeactivated(user.Id, user.Email, DateTimeOffset.UtcNow));
        return NoContent();
    }
}

public record CreateUserRequest(string? Email, string? FullName, string? Role, string? Phone, string? Password);
public record UpdateUserRequest(string? Email, string? FullName, string? Role, string? Phone, bool? IsActive);
