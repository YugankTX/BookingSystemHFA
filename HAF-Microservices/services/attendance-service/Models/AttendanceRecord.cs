namespace AttendanceService.Models;

public class AttendanceRecord
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string BookingId { get; set; } = string.Empty;
    public string BookingReference { get; set; } = string.Empty;
    public string ChildId { get; set; } = string.Empty;
    public string ActivityId { get; set; } = string.Empty;
    public bool Attended { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset RecordedAt { get; set; } = DateTimeOffset.UtcNow;
}
