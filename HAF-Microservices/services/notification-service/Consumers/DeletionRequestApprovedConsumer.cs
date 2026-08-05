using HAF.Shared.Events;
using MassTransit;

namespace NotificationService.Consumers;

public class DeletionRequestApprovedConsumer : IConsumer<DeletionRequestApproved>
{
    private readonly ILogger<DeletionRequestApprovedConsumer> _logger;

    public DeletionRequestApprovedConsumer(ILogger<DeletionRequestApprovedConsumer> logger) => _logger = logger;

    public Task Consume(ConsumeContext<DeletionRequestApproved> context)
    {
        var msg = context.Message;
        _logger.LogInformation(
            "[EMAIL] Subject: GDPR Deletion Approved | " +
            "RequestId: {RequestId} | SubjectType: {SubjectType} | SubjectId: {SubjectId} | ProcessedAt: {ProcessedAt}",
            msg.DeletionRequestId, msg.SubjectType, msg.SubjectId, msg.ProcessedAt);
        return Task.CompletedTask;
    }
}
