using HAF.Shared.Events;
using MassTransit;
using NotificationService.Data;
using NotificationService.Models;

namespace NotificationService.Consumers;

public class BookingCancelledConsumer : IConsumer<BookingCancelled>
{
    private readonly IServiceScopeFactory _scopeFactory;

    public BookingCancelledConsumer(IServiceScopeFactory scopeFactory) => _scopeFactory = scopeFactory;

    public async Task Consume(ConsumeContext<BookingCancelled> context)
    {
        var msg = context.Message;
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();

        db.Notifications.Add(new Notification
        {
            Type       = "booking_cancelled",
            Title      = "Booking Cancelled",
            Body       = $"Booking {msg.BookingReference} has been cancelled.",
            TargetRole = "parent",
            RelatedId  = msg.BookingId,
        });
        await db.SaveChangesAsync();
    }
}
