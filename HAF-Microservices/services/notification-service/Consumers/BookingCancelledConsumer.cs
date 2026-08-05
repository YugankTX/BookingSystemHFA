using HAF.Shared.Events;
using MassTransit;

namespace NotificationService.Consumers;

public class BookingCancelledConsumer : IConsumer<BookingCancelled>
{
    private readonly ILogger<BookingCancelledConsumer> _logger;

    public BookingCancelledConsumer(ILogger<BookingCancelledConsumer> logger) => _logger = logger;

    public Task Consume(ConsumeContext<BookingCancelled> context)
    {
        var msg = context.Message;
        _logger.LogInformation(
            "[EMAIL] BookingId: {BookingId} | Subject: Booking Cancelled | " +
            "Reference: {Ref} | CancelledAt: {CancelledAt}",
            msg.BookingId, msg.BookingReference, msg.CancelledAt);
        return Task.CompletedTask;
    }
}
