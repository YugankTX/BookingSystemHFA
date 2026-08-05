using FamilyService.Data;
using HAF.Shared.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace FamilyService.Consumers;

public class DeletionRequestApprovedConsumer : IConsumer<DeletionRequestApproved>
{
    private readonly FamilyDbContext _db;
    private readonly ILogger<DeletionRequestApprovedConsumer> _logger;

    public DeletionRequestApprovedConsumer(FamilyDbContext db, ILogger<DeletionRequestApprovedConsumer> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<DeletionRequestApproved> context)
    {
        var msg = context.Message;
        _logger.LogInformation("Processing deletion: {SubjectType} {SubjectId}", msg.SubjectType, msg.SubjectId);

        switch (msg.SubjectType.ToLowerInvariant())
        {
            case "child":
                var child = await _db.Children.FindAsync(msg.SubjectId);
                if (child is not null) { _db.Children.Remove(child); await _db.SaveChangesAsync(); }
                break;

            case "parent":
                var parent = await _db.Parents.FindAsync(msg.SubjectId);
                if (parent is not null) { _db.Parents.Remove(parent); await _db.SaveChangesAsync(); }
                break;

            default:
                _logger.LogWarning("Unknown SubjectType: {SubjectType}", msg.SubjectType);
                break;
        }
    }
}
