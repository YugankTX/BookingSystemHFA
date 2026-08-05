namespace BookingService.Models;

public class SeatLock
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string LockToken { get; set; } = Guid.NewGuid().ToString("N");
    public string ActivityId { get; set; } = string.Empty;
    public string ChildId { get; set; } = string.Empty;
    public DateTimeOffset AcquiredAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset ExpiresAt { get; set; }
}
