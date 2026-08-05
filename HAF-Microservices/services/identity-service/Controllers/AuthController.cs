using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using HAF.Shared.Events;
using IdentityService.Data;
using IdentityService.Models;
using IdentityService.Services;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IdentityService.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IdentityDbContext _db;
    private readonly ITokenService _tokens;
    private readonly IPublishEndpoint _publish;

    public AuthController(IdentityDbContext db, ITokenService tokens, IPublishEndpoint publish)
    {
        _db = db;
        _tokens = tokens;
        _publish = publish;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "Email and password are required." });

        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.Email == req.Email.Trim().ToLowerInvariant() && u.IsActive);

        if (user is null || user.PasswordHash != req.Password)
            return Unauthorized(new { message = "Invalid credentials or inactive account." });

        return Ok(BuildResponse(user));
    }

    [HttpPost("signup")]
    public async Task<IActionResult> Signup([FromBody] SignupRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.FullName) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "Full name, email and password are required." });

        if (req.Password.Length < 8)
            return BadRequest(new { message = "Password must be at least 8 characters." });

        var email = req.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(u => u.Email == email))
            return Conflict(new { message = "A user with that email already exists." });

        var user = new AuthUser
        {
            Id           = $"u-{Guid.NewGuid():N}",
            Email        = email,
            FullName     = req.FullName.Trim(),
            Role         = string.IsNullOrWhiteSpace(req.Role) ? "parent" : req.Role.Trim().ToLowerInvariant(),
            Phone        = req.Phone ?? string.Empty,
            IsActive     = true,
            PasswordHash = req.Password,
            CreatedAt    = DateTimeOffset.UtcNow.ToString("o"),
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        await _publish.Publish(new UserCreated(user.Id, user.Email, user.FullName, user.Role, DateTimeOffset.UtcNow));

        return Ok(BuildResponse(user));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (userId is null) return Unauthorized();

        var user = await _db.Users.FindAsync(userId);
        if (user is null || !user.IsActive)
            return Unauthorized(new { message = "User not found or inactive." });

        return Ok(BuildResponse(user));
    }

    private object BuildResponse(AuthUser user) => new
    {
        token = _tokens.GenerateToken(user),
        user  = new { user.Id, user.Email, user.FullName, user.Role, user.Phone, user.IsActive, user.CreatedAt },
    };
}

public record LoginRequest(string? Email, string? Password);
public record SignupRequest(string? Email, string? FullName, string? Password, string? Role, string? Phone);
