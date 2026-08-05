using HAF.Shared.Events;
using MassTransit;

namespace NotificationService.Consumers;

public class UserCreatedConsumer : IConsumer<UserCreated>
{
    private readonly ILogger<UserCreatedConsumer> _logger;

    public UserCreatedConsumer(ILogger<UserCreatedConsumer> logger) => _logger = logger;

    public Task Consume(ConsumeContext<UserCreated> context)
    {
        var msg = context.Message;
        _logger.LogInformation(
            "[EMAIL] To: {Email} | Subject: Welcome to HAF | " +
            "FullName: {FullName} | Role: {Role}",
            msg.Email, msg.FullName, msg.Role);
        return Task.CompletedTask;
    }
}
