using HAF.Shared.Events;
using MassTransit;
using NotificationService.Data;
using NotificationService.Models;

namespace NotificationService.Consumers;

public class DeletionRequestApprovedConsumer : IConsumer<DeletionRequestApproved>
{
    private readonly IServiceScopeFactory _scopeFactory;

    public DeletionRequestApprovedConsumer(IServiceScopeFactory scopeFactory) => _scopeFactory = scopeFactory;

    public async Task Consume(ConsumeContext<DeletionRequestApproved> context)
    {
        var msg = context.Message;
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();

        db.Notifications.Add(new Notification
        {
            Type       = "deletion_approved",
            Title      = "Deletion Request Processed",
            Body       = $"GDPR deletion request for {msg.SubjectType} has been approved and processed.",
            TargetRole = "admin",
            RelatedId  = msg.DeletionRequestId,
        });
        await db.SaveChangesAsync();
    }
}
