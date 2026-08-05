using HAF.Shared.Events;
using MassTransit;

namespace NotificationService.Consumers;

public class BookingConfirmedConsumer : IConsumer<BookingConfirmed>
{
    private readonly ILogger<BookingConfirmedConsumer> _logger;

    public BookingConfirmedConsumer(ILogger<BookingConfirmedConsumer> logger) => _logger = logger;

    public Task Consume(ConsumeContext<BookingConfirmed> context)
    {
        var msg = context.Message;
        _logger.LogInformation(
            "[EMAIL] To: {ChildName} | Subject: Booking Confirmed | " +
            "Reference: {Ref} | Activity: {Activity} | BookedAt: {BookedAt}",
            msg.ChildName, msg.BookingReference, msg.ActivityTitle, msg.BookedAt);
        return Task.CompletedTask;
    }
}
