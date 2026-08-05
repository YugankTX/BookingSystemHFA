namespace HAF.Shared.Events;

public record UserCreated(
    string UserId,
    string Email,
    string FullName,
    string Role,
    DateTimeOffset CreatedAt);

public record UserDeactivated(
    string UserId,
    string Email,
    DateTimeOffset DeactivatedAt);
