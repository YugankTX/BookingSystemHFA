using BookingService.Data;
using HAF.Shared.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace BookingService.Consumers;

public class DeletionRequestApprovedConsumer : IConsumer<DeletionRequestApproved>
{
    private readonly BookingDbContext _db;
    private readonly IPublishEndpoint _publish;
    private readonly ILogger<DeletionRequestApprovedConsumer> _logger;

    public DeletionRequestApprovedConsumer(BookingDbContext db, IPublishEndpoint publish, ILogger<DeletionRequestApprovedConsumer> logger)
    {
        _db = db;
        _publish = publish;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<DeletionRequestApproved> context)
    {
        var msg = context.Message;
        if (msg.SubjectType.ToLowerInvariant() != "child") return;

        var bookings = await _db.Bookings
            .Where(b => b.ChildId == msg.SubjectId && b.Status != "Cancelled")
            .ToListAsync();

        foreach (var booking in bookings)
        {
            booking.Status      = "Cancelled";
            booking.CancelledAt = DateTimeOffset.UtcNow;
            await _publish.Publish(new BookingCancelled(
                booking.Id, booking.ChildId, booking.ActivityId,
                booking.BookingReference, booking.CancelledAt.Value));
        }

        if (bookings.Count > 0)
        {
            await _db.SaveChangesAsync();
            _logger.LogInformation("Cancelled {Count} bookings for deleted child {ChildId}", bookings.Count, msg.SubjectId);
        }
    }
}
