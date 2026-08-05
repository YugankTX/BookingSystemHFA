namespace IdentityService.Models;

public class AuthUser
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = "parent";
    public string Phone { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public string PasswordHash { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
}
