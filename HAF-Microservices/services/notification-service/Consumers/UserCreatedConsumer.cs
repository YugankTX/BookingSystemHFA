using HAF.Shared.Events;
using MassTransit;
using NotificationService.Data;
using NotificationService.Models;

namespace NotificationService.Consumers;

public class UserCreatedConsumer : IConsumer<UserCreated>
{
    private readonly IServiceScopeFactory _scopeFactory;

    public UserCreatedConsumer(IServiceScopeFactory scopeFactory) => _scopeFactory = scopeFactory;

    public async Task Consume(ConsumeContext<UserCreated> context)
    {
        var msg = context.Message;
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();

        db.Notifications.Add(new Notification
        {
            Type       = "user_created",
            Title      = "New User Registered",
            Body       = $"{msg.FullName} ({msg.Role}) joined the system.",
            TargetRole = "admin",
            RelatedId  = msg.UserId,
        });
        await db.SaveChangesAsync();
    }
}
