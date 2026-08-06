using HAF.Shared.Events;
using MassTransit;
using NotificationService.Data;
using NotificationService.Models;

namespace NotificationService.Consumers;

public class BookingConfirmedConsumer : IConsumer<BookingConfirmed>
{
    private readonly IServiceScopeFactory _scopeFactory;

    public BookingConfirmedConsumer(IServiceScopeFactory scopeFactory) => _scopeFactory = scopeFactory;

    public async Task Consume(ConsumeContext<BookingConfirmed> context)
    {
        var msg = context.Message;
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();

        db.Notifications.Add(new Notification
        {
            Type       = "booking_confirmed",
            Title      = "Booking Confirmed",
            Body       = $"Booking for {msg.ChildName} at \"{msg.ActivityTitle}\" has been confirmed. Reference: {msg.BookingReference}.",
            TargetRole = "parent",
            RelatedId  = msg.BookingId,
        });
        await db.SaveChangesAsync();
    }
}
