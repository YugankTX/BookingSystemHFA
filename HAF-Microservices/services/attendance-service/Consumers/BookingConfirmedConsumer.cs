using AttendanceService.Data;
using AttendanceService.Models;
using HAF.Shared.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace AttendanceService.Consumers;

public class BookingConfirmedConsumer : IConsumer<BookingConfirmed>
{
    private readonly AttendanceDbContext _db;
    private readonly ILogger<BookingConfirmedConsumer> _logger;

    public BookingConfirmedConsumer(AttendanceDbContext db, ILogger<BookingConfirmedConsumer> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<BookingConfirmed> context)
    {
        var msg = context.Message;

        if (await _db.AttendanceRecords.AnyAsync(a => a.BookingId == msg.BookingId))
            return;

        var record = new AttendanceRecord
        {
            Id               = Guid.NewGuid().ToString("N"),
            BookingId        = msg.BookingId,
            BookingReference = msg.BookingReference,
            ChildId          = msg.ChildId,
            ActivityId       = msg.ActivityId,
            Attended         = false,
            RecordedAt       = DateTimeOffset.UtcNow,
        };

        _db.AttendanceRecords.Add(record);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Pre-registered attendance slot for booking {BookingReference}", msg.BookingReference);
    }
}
