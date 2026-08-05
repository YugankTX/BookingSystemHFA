namespace BookingService.Models;

public class Booking
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string ChildId { get; set; } = string.Empty;
    public string ChildName { get; set; } = string.Empty;
    public string ActivityId { get; set; } = string.Empty;
    public string ActivityTitle { get; set; } = string.Empty;
    public DateTimeOffset ActivityStartDateTime { get; set; }
    public DateTimeOffset ActivityEndDateTime { get; set; }
    public int ActivityCapacity { get; set; }
    public string Status { get; set; } = "Confirmed";
    public string BookingReference { get; set; } = string.Empty;
    public DateTimeOffset BookedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ConfirmedAt { get; set; }
    public DateTimeOffset? CancelledAt { get; set; }
    public string? Notes { get; set; }
}
